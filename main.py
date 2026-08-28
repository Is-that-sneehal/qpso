# main.py
import time
import streamlit as st
import config
import sessionstate
import logic
import api
import frontend
from report_generator import generate_report_data, export_report_json, export_report_pdf

# 1. Setup Page & State
st.set_page_config(**config.PAGE_CONFIG)
config.load_css()
sessionstate.init_session_state()

frontend.render_header()

# 2. Render Sidebar Inputs
page, start_loc, is_round_trip, mileage, fuel_price, fleet_size, q_params, go_btn = frontend.render_sidebar()

# 3. Main Application Logic
if go_btn:
    if not start_loc:
        st.error("⚠️ Please select a Start Location.")
        st.session_state.solver_status = "Failed"
    elif not st.session_state.stops_data:
        st.error("⚠️ Please add at least one stop.")
        st.session_state.solver_status = "Failed"
    else:
        with st.status("🚀 Initiating Quantum Sequence...", expanded=True) as status:
            st.write("⚡ Initializing energy landscape...")
            time.sleep(0.4)
            st.write("⚛️ Tunneling through local minima...")
            time.sleep(0.4)
            st.write("🔄 Converging on optimal route...")
            
            st.session_state.is_round_trip_active = is_round_trip
            st.session_state.solver_status = "Running"
            
            # --- CALL QUANTUM SOLVER ---
            routes_list, stats = logic.optimize_route_algo(
                start_loc, 
                st.session_state.stops_data, 
                round_trip=is_round_trip,
                fleet_size=fleet_size,
                quantum_params=q_params
            )
            
            # --- SPLIT PATH PROCESSING ---
            total_km = 0
            total_min = 0
            all_routes_geo = []
            all_markers = []
            all_coords = []
            vehicle_metrics = []
            any_fallback = False
            
            for v_idx, route_nodes in enumerate(routes_list):
                # Get Geometry for this specific vehicle route
                coords_seq = [n['coords'] for n in route_nodes]
                path_res = api.get_road_path(coords_seq)
                
                if len(path_res) == 4:
                    path_geo, km, mins, is_fallback = path_res
                else:
                    path_geo, km, mins = path_res
                    is_fallback = False

                if is_fallback:
                    any_fallback = True
                
                total_km += km
                total_min += mins
                all_routes_geo.append({
                    "geo": path_geo if path_geo else coords_seq,
                    "is_fallback": is_fallback
                })
                
                vehicle_metrics.append({
                    "id": v_idx + 1,
                    "dist": km,
                    "time": mins
                })
                
                # Collect Marker Data with Vehicle Info
                for s_idx, node in enumerate(route_nodes):
                    all_markers.append({
                        "coords": node['coords'],
                        "name": node['name'],
                        "vehicle_id": v_idx,
                        "stop_idx": s_idx,
                        "is_last": s_idx == len(route_nodes) - 1,
                        "window": node.get('window')
                    })
                    all_coords.append(node['coords'])
            
            if any_fallback:
                st.warning("⚠️ Live road routing service unavailable. Displaying approximate geodesic route lines.")
            
            # --- CALCULATE LOGISTICS METRICS ---
            total_fuel = total_km / mileage
            total_cost = total_fuel * fuel_price
            
            # --- UPDATE SESSION STATE ---
            st.session_state.route_metrics = {
                "dist": total_km,
                "time": total_min,
                "fuel": total_fuel,
                "cost": total_cost,
                "vehicles": vehicle_metrics
            }
            
            # Store split geometries so Frontend can color them differently
            st.session_state.optimized_route = {
                "markers": all_markers,
                "coords": all_coords,
                "routes_geo": all_routes_geo # List of geometries with fallback flags
            }
            
            # Store Quantum Analytics
            st.session_state.optimization_stats = stats

            # Store solver outputs for report generation (persist across rerun)
            st.session_state.report_routes = routes_list
            st.session_state.report_start_node = start_loc
            st.session_state.report_stops_data = list(st.session_state.stops_data)
            
            st.session_state.solver_status = "Completed"
            status.update(label="Optimization Complete!", state="complete", expanded=False)
            time.sleep(0.5)
            st.rerun()

# 4. Render Results Dashboard
if page == "Route Optimizer":
    if not st.session_state.optimized_route:
        st.info("👈 Please configure your stops in the sidebar and click RUN to start.")
    else:
        frontend.render_optimizer_view()

        # ── 5. Report Generation (additive, end of flow) ─────────────
        if (
            st.session_state.get("report_routes")
            and st.session_state.get("optimization_stats")
        ):
            st.markdown("---")
            selected_use_case = st.selectbox(
                "Report type",
                ["generic", "delivery", "emergency"],
                help="Controls the recommendations section of the report.",
            )
            if st.button("📊 Generate Report"):
                report_data = generate_report_data(
                    start_node=st.session_state.report_start_node,
                    stops_data=st.session_state.report_stops_data,
                    routes=st.session_state.report_routes,
                    stats=st.session_state.optimization_stats,
                    use_case=selected_use_case,
                )
                json_path = export_report_json(report_data, "outputs/report.json")
                pdf_path = export_report_pdf(report_data, "outputs/report.pdf")
                frontend.render_download_report_buttons(json_path, pdf_path)

elif page == "Quantum Analytics":
    frontend.render_analytics_view()

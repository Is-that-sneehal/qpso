import dotenv, os
dotenv.load_dotenv()
import logic

# Define locations
start_loc = {'name': 'New Delhi', 'coords': (28.6139, 77.2090)}
stops_data = [
    {'name': 'Jaipur', 'coords': (26.9124, 75.7873)},
    {'name': 'Agra', 'coords': (27.1767, 78.0081)},
    {'name': 'Chandigarh', 'coords': (30.7333, 76.7794)}
]

print('Calling Main Backend Logic (logic.optimize_route_qpso_traffic)...')
routes_list, stats = logic.optimize_route_qpso_traffic(
    start_loc, 
    stops_data, 
    round_trip=True,
    fleet_size=1,
    quantum_params={'iter': 100, 'n_particles': 10}
)

print('\n=== OPTIMIZATION RESULTS ===')
for v_idx, route in enumerate(routes_list):
    print(f'\nVehicle {v_idx + 1} Route:')
    for i, node in enumerate(route):
        print(f'  {i}. {node.get("name", "Unknown")} ({node["coords"][0]:.3f}, {node["coords"][1]:.3f})')

print('\n=== STATISTICS ===')
print(f'Total Distance (km) : {stats.get("final_distance_km", 0):.2f}')
print(f'Total Time (hours)  : {stats.get("final_time_hours", 0):.2f}')
print(f'Algorithm Used      : QPSO with Live Traffic')

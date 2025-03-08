import numpy as np
import matplotlib.pyplot as plt
import yaml
import matplotlib.animation as animation


# Load sequence from YAML file
def load_sequence(file_path):
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


# Define movement mapping based on clock times
movement_map = {
    1200: (0, 1),  # Up
    130: (1, 1),  # Up-right
    300: (1, 0),  # Right
    430: (1, -1),  # Down-right
    600: (0, -1),  # Down
    730: (-1, -1),  # Down-left
    900: (-1, 0),  # Left
    1030: (-1, 1),  # Up-left
}


# Convert sequence into movement steps and waypoints
def generate_waypoints(sequence):
    waypoints = [[0, 0]]  # Start at (0,0)
    for step in sequence:
        if step in movement_map:
            x_offset, y_offset = movement_map[step]
            waypoints.append([waypoints[-1][0] + x_offset, waypoints[-1][1] + y_offset])
    return np.array(waypoints)


# Interpolation settings
frames_per_segment = 30  # Smoothness of movement


def interpolate_positions(waypoints, frames_per_segment):
    positions = []
    for i in range(len(waypoints) - 1):
        start, end = waypoints[i], waypoints[i + 1]
        for t in np.linspace(0, 1, frames_per_segment):
            interp_pos = (1 - t) * start + t * end  # Linear interpolation
            positions.append(interp_pos)
    return positions


# Load and process sequence
sequence_file = "sequence.yml"
sequence = load_sequence(sequence_file)
waypoints = generate_waypoints(sequence)
positions = interpolate_positions(waypoints, frames_per_segment)

# Create figure
fig, ax = plt.subplots(figsize=(5, 5))
ax.set_xlim(-3, 3)
ax.set_ylim(-3, 3)
ax.set_xticks([])
ax.set_yticks([])
ax.axis("off")
ax.scatter(0, 0, color="black", s=20, zorder=2)  # Fixed black dot at (0,0)
(point,) = ax.plot([], [], "ro", markersize=10, zorder=3)


# Update function for animation
def update(frame):
    new_x, new_y = positions[frame]  # Unpack x, y values
    point.set_data([new_x], [new_y])  # Update point position
    return (point,)


fps = 25

# Create animation
ani = animation.FuncAnimation(
    fig, update, frames=len(positions), interval=1000 // fps, blit=True
)

# Save animation as GIF
ani.save("animated_sequence.gif", writer="pillow", fps=50)
plt.show()

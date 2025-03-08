import numpy as np
import matplotlib.pyplot as plt
import imageio.v3 as iio
import matplotlib.animation as animation

# Define grid size
grid_size = 3

# Define waypoints (path the point follows)
waypoints = np.array(
    [
        [0, 0],  # Start
        [1, 1],  # Move diagonally up-right
        [2, 0],  # Move right-down
        [1, -1],  # Move diagonally down-left
        [0, 0],  # Back to start (loop)
    ]
)

# Interpolation settings
frames_per_segment = 40  # Smoothness (higher = smoother)
positions = []

# Generate interpolated positions
for i in range(len(waypoints) - 1):
    start = waypoints[i]
    end = waypoints[i + 1]
    for t in np.linspace(0, 1, frames_per_segment):
        interp_pos = (1 - t) * start + t * end  # Linear interpolation
        positions.append(interp_pos)

# Create figure
fig, ax = plt.subplots(figsize=(5, 5))
ax.set_xlim(-1, grid_size + 1)
ax.set_ylim(-2, grid_size)
ax.set_xticks([])
ax.set_yticks([])
ax.axis("off")

# Add fixed black dot at (0,0)
ax.scatter(0, 0, color="black", s=20, zorder=2)

# Plot moving red point
(point,) = ax.plot([], [], "ro", markersize=10, zorder=3)


# Update function for animation
def update(frame):
    new_x, new_y = positions[frame]  # Unpack x, y values
    point.set_data([new_x], [new_y])  # Update point position
    return (point,)


# Create animation
ani = animation.FuncAnimation(
    fig, update, frames=len(positions), interval=20, blit=True
)

# Save animation as GIF
ani.save("tracing_path_with_black_dot.gif", writer="pillow", fps=20)
plt.show()

import numpy as np
import matplotlib.pyplot as plt
import imageio.v3 as iio
import matplotlib.animation as animation

# Define grid size and movement pattern
grid_size = 10
steps = [(1, 1), (1, -1), (-1, -1), (-1, 1)]  # 45-degree movements

# Starting position
x, y = 5, 5
frames = 40  # More frames for smooth animation

# Generate interpolated path
positions = []
for i in range(frames):
    step_index = (i // 10) % 4  # Change direction every 10 frames
    progress = (i % 10) / 10  # Progress within the step (0 to 1)

    # Compute interpolated position
    new_x = x + steps[step_index][0] * progress
    new_y = y + steps[step_index][1] * progress
    positions.append((new_x, new_y))

# Create figure
fig, ax = plt.subplots(figsize=(5, 5))
ax.set_xlim(0, grid_size)
ax.set_ylim(0, grid_size)
ax.set_xticks([])
ax.set_yticks([])
ax.axis("off")

# Plot initial point
(point,) = ax.plot([], [], "ro", markersize=10)


# Update function for animation
def update(frame):
    new_x, new_y = positions[frame]  # Unpack x, y values
    point.set_data([new_x], [new_y])  # Fix: Pass x and y as lists
    return (point,)


# Create animation
ani = animation.FuncAnimation(
    fig, update, frames=len(positions), interval=50, blit=True
)

# Save animation as GIF
ani.save("smooth_moving_point.gif", writer="pillow", fps=20)
plt.show()

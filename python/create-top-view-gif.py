import numpy as np
import matplotlib.pyplot as plt
import yaml
import matplotlib.animation as animation
from typing import List, Tuple


# Load configuration from YAML file
def load_sequence(file_path: str) -> List[int]:
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


# Movement mapping based on clock times
MOVEMENT_MAP = {
    1200: (0, 1),  # Up
    130: (1, 1),  # Up-right
    300: (1, 0),  # Right
    430: (1, -1),  # Down-right
    600: (0, -1),  # Down
    730: (-1, -1),  # Down-left
    900: (-1, 0),  # Left
    1030: (-1, 1),  # Up-left
}


def generate_waypoints(sequence: List[int]) -> np.ndarray:
    """Generate waypoints based on sequence."""
    waypoints = np.array([[0, 0]])  # Start at (0,0)
    for step in sequence:
        if step in MOVEMENT_MAP:
            movement = MOVEMENT_MAP[step]
            new_waypoint = waypoints[-1] + movement
            waypoints = np.vstack([waypoints, new_waypoint])
    return waypoints


def interpolate_positions(
    waypoints: np.ndarray, frames_per_segment: int
) -> List[np.ndarray]:
    """Interpolate positions between waypoints."""
    return [
        (1 - t) * start + t * end
        for i in range(len(waypoints) - 1)
        for t in np.linspace(0, 1, frames_per_segment)
        for start, end in [(waypoints[i], waypoints[i + 1])]
    ]


def setup_plot() -> Tuple[plt.Figure, plt.Axes, plt.Line2D]:
    """Set up the figure for the animation."""
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.set_xlim(-3, 3)
    ax.set_ylim(-3, 3)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.axis("off")
    ax.scatter(0, 0, color="black", s=20, zorder=2)  # Fixed black dot at (0,0)
    (point,) = ax.plot([], [], "ro", markersize=10, zorder=3)
    return fig, ax, point


def update(
    frame: int, positions_with_pause: List[np.ndarray], point: plt.Line2D
) -> Tuple[plt.Line2D]:
    """Update the point position for the animation."""
    new_x, new_y = positions_with_pause[frame]  # Unpack x, y values
    point.set_data([new_x], [new_y])  # Ensure x and y are lists (or sequences)
    return (point,)


def create_animation(positions_with_pause: List[np.ndarray], fps: int, save_path: str):
    """Create and save the animation."""
    fig, ax, point = setup_plot()
    ani = animation.FuncAnimation(
        fig,
        update,
        frames=len(positions_with_pause),
        fargs=(positions_with_pause, point),
        interval=1000 // fps,
        blit=True,
    )
    ani.save(save_path, writer="pillow", fps=fps)


def main():
    # Configuration
    sequence_file = "sequence.yml"
    fps = 50
    frames_per_segment = 30
    pause_frames = fps  # 1 second pause at the end

    # Load and process sequence
    sequence = load_sequence(sequence_file)
    waypoints = generate_waypoints(sequence)
    positions = interpolate_positions(waypoints, frames_per_segment)

    # Add pause at the end
    positions_with_pause = positions + [positions[-1]] * pause_frames

    # Create and save the animation
    create_animation(positions_with_pause, fps, "animated_sequence.gif")


if __name__ == "__main__":
    main()

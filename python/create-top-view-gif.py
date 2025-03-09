import logging
from typing import List, Tuple

import yaml
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.patches import FancyArrowPatch

# Configure logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)


# Load configuration from YAML file
def load_sequence(file_path: str) -> List[dict]:
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


def generate_waypoints(
    sequence: List[dict],
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate waypoints for the center of gravity, left foot, and right foot."""

    cg_points = np.array([[0, 0]])  # Center of gravity
    cg_directions = np.array([1200])
    left_foot_points = np.array([[-0.5, 0]])  # Left foot
    right_foot_points = np.array([[0.5, 0]])  # Right foot

    for step in sequence:
        logging.debug(f"Processing step: {step}")  # Log current step being processed

        active_foot = "L" if "L" in step else "R"
        movement_direction = step["L"] if "L" in step else step["R"]
        facing_direction = step["F"]

        movement = MOVEMENT_MAP.get(movement_direction)
        if movement:
            if active_foot == "L":
                right_foot_points = np.vstack(
                    [right_foot_points, right_foot_points[-1]]
                )
                new_left_foot_position = right_foot_points[-1] + movement
                left_foot_points = np.vstack([left_foot_points, new_left_foot_position])
            elif active_foot == "R":
                left_foot_points = np.vstack([left_foot_points, left_foot_points[-1]])
                new_right_foot_position = left_foot_points[-1] + movement
                right_foot_points = np.vstack(
                    [right_foot_points, new_right_foot_position]
                )
            logging.debug(f"Updated Left Foot position: {left_foot_points[-1]}")
            logging.debug(f"Updated Right Foot position: {right_foot_points[-1]}")
            # Update center of gravity to be in between feet
            cg_x = (left_foot_points[-1][0] + right_foot_points[-1][0]) / 2
            cg_y = (left_foot_points[-1][1] + right_foot_points[-1][1]) / 2
            cg_points = np.vstack([cg_points, [cg_x, cg_y]])
            logging.debug(f"Updated CG position: {cg_points[-1]}")
            cg_directions = np.append(cg_directions, facing_direction)
            logging.debug(f"Updated CG direction: {cg_directions[-1]}")

    logging.debug(f"Final CG positions: {cg_points}")  # Log final CG positions
    logging.debug(f"Final CG directions: {cg_directions}")  # Log final CG directions
    logging.debug(
        f"Final Left Foot positions: {left_foot_points}"
    )  # Log final Left Foot positions
    logging.debug(
        f"Final Right Foot positions: {right_foot_points}"
    )  # Log final Right Foot positions

    return cg_points, left_foot_points, right_foot_points


def interpolate_positions(
    cg_points: np.ndarray,
    left_foot_points: np.ndarray,
    right_foot_points: np.ndarray,
    frames_per_segment: int,
) -> Tuple[List[np.ndarray], List[np.ndarray], List[np.ndarray]]:
    """Interpolate positions for center of gravity, left foot, and right foot."""
    cg_positions, left_positions, right_positions = [], [], []

    for i in range(len(cg_points) - 1):
        start_cg, end_cg = cg_points[i], cg_points[i + 1]
        start_left, end_left = left_foot_points[i], left_foot_points[i + 1]
        start_right, end_right = right_foot_points[i], right_foot_points[i + 1]

        for t in np.linspace(0, 1, frames_per_segment):
            cg_positions.append((1 - t) * start_cg + t * end_cg)
            left_positions.append((1 - t) * start_left + t * end_left)
            right_positions.append((1 - t) * start_right + t * end_right)

    return cg_positions, left_positions, right_positions


def setup_plot() -> Tuple[plt.Figure, plt.Axes, plt.Line2D, plt.Line2D, plt.Line2D]:
    """Set up the figure for the animation."""
    fig, ax = plt.subplots(figsize=(5, 5))
    ax.set_xlim(-3, 3)
    ax.set_ylim(-3, 3)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.axis("off")
    ax.scatter(0, 0, color="black", s=20, zorder=2)  # Fixed black dot at (0,0)

    # Points for center of gravity, left foot, and right foot
    (cg_point,) = ax.plot([], [], "ro", markersize=10, zorder=3)
    (left_foot_point,) = ax.plot([], [], "go", markersize=10, zorder=3)
    (right_foot_point,) = ax.plot([], [], "bo", markersize=10, zorder=3)

    # Directional arrow (facing)
    direction_arrow = FancyArrowPatch(
        posA=(0, 0),
        posB=(0, 1),
        color="red",
        arrowstyle="->",
        mutation_scale=15,
        zorder=4,
    )
    ax.add_patch(direction_arrow)

    return fig, ax, cg_point, left_foot_point, right_foot_point, direction_arrow


def update(
    frame: int,
    cg_positions: List[np.ndarray],
    left_positions: List[np.ndarray],
    right_positions: List[np.ndarray],
    direction_angles: List[float],
    cg_point: plt.Line2D,
    left_foot_point: plt.Line2D,
    right_foot_point: plt.Line2D,
    direction_arrow: FancyArrowPatch,
) -> Tuple[plt.Line2D, plt.Line2D, plt.Line2D, FancyArrowPatch]:
    """Update the points and direction for the animation."""
    new_cg = cg_positions[frame]
    new_left_foot = left_positions[frame]
    new_right_foot = right_positions[frame]

    cg_point.set_data([new_cg[0]], [new_cg[1]])  # Update center of gravity
    left_foot_point.set_data([new_left_foot[0]], [new_left_foot[1]])  # Update left foot
    right_foot_point.set_data(
        [new_right_foot[0]], [new_right_foot[1]]
    )  # Update right foot

    # Update facing direction
    angle = direction_angles[frame]
    direction_arrow.set_positions(
        new_cg,
        (new_cg[0] + np.cos(np.radians(angle)), new_cg[1] + np.sin(np.radians(angle))),
    )

    return cg_point, left_foot_point, right_foot_point, direction_arrow


def create_animation(
    cg_positions: List[np.ndarray],
    left_positions: List[np.ndarray],
    right_positions: List[np.ndarray],
    direction_angles: List[float],
    fps: int,
    save_path: str,
):
    """Create and save the animation."""
    fig, ax, cg_point, left_foot_point, right_foot_point, direction_arrow = setup_plot()
    ani = animation.FuncAnimation(
        fig,
        update,
        frames=len(cg_positions),
        fargs=(
            cg_positions,
            left_positions,
            right_positions,
            direction_angles,
            cg_point,
            left_foot_point,
            right_foot_point,
            direction_arrow,
        ),
        interval=1000 // fps,
        blit=True,
    )
    ani.save(save_path, writer="pillow", fps=fps)


def main():
    # Configuration
    sequence_file = "short-form-1.yml"
    fps = 50
    frames_per_segment = 30
    pause_frames = fps  # 1 second pause at the end

    # Load and process sequence
    sequence = load_sequence(sequence_file)
    cg_points, left_foot_points, right_foot_points = generate_waypoints(sequence)
    cg_positions, left_positions, right_positions = interpolate_positions(
        cg_points, left_foot_points, right_foot_points, frames_per_segment
    )

    # Calculate direction angles (for simplicity, we assume the facing direction is given as an angle)
    direction_angles = []
    for step in sequence:
        direction_angles.append(step["F"])  # Assuming facing direction is stored in 'F'

    # Interpolate direction angles
    interpolated_angles = []
    for i in range(len(direction_angles) - 1):
        for t in np.linspace(0, 1, frames_per_segment):
            interpolated_angles.append(
                (1 - t) * direction_angles[i] + t * direction_angles[i + 1]
            )

    # Add pause at the end
    cg_positions_with_pause = cg_positions + [cg_positions[-1]] * pause_frames
    left_positions_with_pause = left_positions + [left_positions[-1]] * pause_frames
    right_positions_with_pause = right_positions + [right_positions[-1]] * pause_frames
    interpolated_angles_with_pause = (
        interpolated_angles + [interpolated_angles[-1]] * pause_frames
    )

    # Create and save the animation
    create_animation(
        cg_positions_with_pause,
        left_positions_with_pause,
        right_positions_with_pause,
        interpolated_angles_with_pause,
        fps,
        "animated_sequence_with_feet_and_direction.gif",
    )


if __name__ == "__main__":
    main()

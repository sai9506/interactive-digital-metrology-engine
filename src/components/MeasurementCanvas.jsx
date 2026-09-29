import { useEffect, useRef, useState } from "react";

function MeasurementCanvas({
  image,
  mode,
  onDistanceChange,
  onReferenceDistance,
  onAreaChange,
  onPerimeterChange,
  resetKey
}) {
  const canvasRef = useRef(null);

  const [points, setPoints] = useState([]);
  const [finished, setFinished] = useState(false);

  // Reset whenever mode, image, or resetKey changes
  useEffect(() => {
    setPoints([]);
    setFinished(false);
  }, [mode, image, resetKey]);

  // Calculate distance between two points
  const calculateDistance = (p1, p2) => {
    return Math.hypot(
      p2.x - p1.x,
      p2.y - p1.y
    );
  };

  // Calculate polygon area
  const calculateArea = (polygon) => {
    let sum = 0;

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;

      sum +=
        polygon[i].x * polygon[j].y -
        polygon[j].x * polygon[i].y;
    }

    return Math.abs(sum) / 2;
  };

  // Calculate polygon perimeter
  const calculatePerimeter = (polygon) => {
    let total = 0;

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;

      total += calculateDistance(
        polygon[i],
        polygon[j]
      );
    }

    return total;
  };

  // Draw image and measurement points
  useEffect(() => {
    if (!image) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    const img = new Image();

    img.onload = () => {
      const maxWidth = 800;
      const maxHeight = 500;

      const ratio = Math.min(
        maxWidth / img.width,
        maxHeight / img.height,
        1
      );

      const width = Math.round(
        img.width * ratio
      );

      const height = Math.round(
        img.height * ratio
      );

      canvas.width = width;
      canvas.height = height;

      // Draw image
      context.drawImage(
        img,
        0,
        0,
        width,
        height
      );

      // Draw measurement lines
      if (points.length > 0) {
        context.beginPath();

        context.moveTo(
          points[0].x,
          points[0].y
        );

        for (let i = 1; i < points.length; i++) {
          context.lineTo(
            points[i].x,
            points[i].y
          );
        }

        // Close polygon for area/perimeter
        if (
          finished &&
          (mode === "area" ||
            mode === "perimeter")
        ) {
          context.closePath();

          context.fillStyle =
            "rgba(16, 185, 129, 0.18)";

          context.fill();
        }

        // Measurement line
        context.strokeStyle = "#22d3ee";

        context.lineWidth = 3;

        context.lineCap = "round";
        context.lineJoin = "round";

        context.stroke();
      }

      // Draw points
      points.forEach((point, index) => {
        // Outer glow
        context.beginPath();

        context.arc(
          point.x,
          point.y,
          8,
          0,
          Math.PI * 2
        );

        context.fillStyle =
          "rgba(34, 211, 238, 0.18)";

        context.fill();

        // Point
        context.beginPath();

        context.arc(
          point.x,
          point.y,
          5,
          0,
          Math.PI * 2
        );

        context.fillStyle = "#f43f5e";

        context.fill();

        context.strokeStyle = "#ffffff";

        context.lineWidth = 2;

        context.stroke();

        // Point label
        context.font =
          "bold 13px Arial";

        const label =
          `P${index + 1}`;

        const labelX =
          point.x + 11;

        const labelY =
          point.y - 11;

        // Label background
        const textWidth =
          context.measureText(label).width;

        context.fillStyle =
          "rgba(2, 6, 23, 0.82)";

        context.fillRect(
          labelX - 4,
          labelY - 13,
          textWidth + 8,
          18
        );

        // Label text
        context.fillStyle = "#f8fafc";

        context.fillText(
          label,
          labelX,
          labelY
        );
      });
    };

    img.src = image;
  }, [
    image,
    points,
    mode,
    finished
  ]);

  // Handle canvas click
  const handleCanvasClick = (event) => {
    if (finished) return;

    const canvas = canvasRef.current;

    const rect =
      canvas.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) *
      (canvas.width / rect.width);

    const y =
      (event.clientY - rect.top) *
      (canvas.height / rect.height);

    const point = { x, y };

    // Calibration / distance use exactly two points
    if (
      mode === "calibration" ||
      mode === "distance"
    ) {
      const newPoints =
        points.length >= 2
          ? [point]
          : [...points, point];

      setPoints(newPoints);

      if (mode === "calibration") {
        onReferenceDistance(null);
      } else {
        onDistanceChange(null);
      }

      if (newPoints.length === 2) {
        const pixels =
          calculateDistance(
            newPoints[0],
            newPoints[1]
          );

        if (mode === "calibration") {
          onReferenceDistance(pixels);
        } else {
          onDistanceChange(pixels);
        }
      }

      return;
    }

    // Area / perimeter
    setPoints((previous) => [
      ...previous,
      point
    ]);

    onAreaChange(null);
    onPerimeterChange(null);
  };

  // Undo last point
  const handleUndo = () => {
    setFinished(false);

    setPoints((previous) =>
      previous.slice(0, -1)
    );

    if (mode === "calibration") {
      onReferenceDistance(null);
    }

    if (mode === "distance") {
      onDistanceChange(null);
    }

    onAreaChange(null);
    onPerimeterChange(null);
  };

  // Clear all points
  const handleClear = () => {
    setPoints([]);

    setFinished(false);

    if (mode === "calibration") {
      onReferenceDistance(null);
    }

    if (mode === "distance") {
      onDistanceChange(null);
    }

    onAreaChange(null);
    onPerimeterChange(null);
  };

  // Finish area/perimeter measurement
  const handleFinish = () => {
    if (points.length < 3) {
      alert(
        "Select at least three points."
      );

      return;
    }

    if (mode === "area") {
      onAreaChange(
        calculateArea(points)
      );
    }

    if (mode === "perimeter") {
      onPerimeterChange(
        calculatePerimeter(points)
      );
    }

    setFinished(true);
  };

  return (
    <div className="measurement-canvas-wrapper">

      {/* Canvas */}
      <div className="canvas-frame">

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="measurement-canvas"
        />

      </div>

      {/* Status */}
      <div className="canvas-status">

        <div className="points-status">

          <span className="status-dot"></span>

          <span>
            Points selected:
          </span>

          <strong>
            {points.length}
          </strong>

        </div>

        {finished && (
          <div className="finished-status">
            ✓ Measurement finished
          </div>
        )}

      </div>

      {/* Actions */}
      <div className="canvas-actions">

        <button
          type="button"
          onClick={handleUndo}
          disabled={points.length === 0}
          className="canvas-button undo-button"
        >
          ↶ Undo Last Point
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={points.length === 0}
          className="canvas-button clear-points-button"
        >
          ✕ Clear Points
        </button>

        {(mode === "area" ||
          mode === "perimeter") && (
          <button
            type="button"
            onClick={handleFinish}
            disabled={
              points.length < 3 ||
              finished
            }
            className="canvas-button finish-button"
          >
            ✓ Finish Measurement
          </button>
        )}

      </div>

    </div>
  );
}

export default MeasurementCanvas;
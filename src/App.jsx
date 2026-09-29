import { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import MeasurementCanvas from "./components/MeasurementCanvas";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");

  const [distance, setDistance] = useState(null);
  const [area, setArea] = useState(null);
  const [perimeter, setPerimeter] = useState(null);

  const [mode, setMode] = useState("calibration");
  const [resetKey, setResetKey] = useState(0);

  const [referenceDistance, setReferenceDistance] =
    useState(null);

  const [referenceLength, setReferenceLength] =
    useState("");

  const [unit, setUnit] = useState("cm");

  const [scale, setScale] = useState(null);
  const [calibrated, setCalibrated] = useState(false);

  const [accuracyReference, setAccuracyReference] =
    useState("");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("metrologyHistory") || "[]"
      );
    } catch {
      return [];
    }
  });

  /* =========================================================
     HISTORY
     ========================================================= */

  const saveHistory = (updatedHistory) => {
    setHistory(updatedHistory);

    try {
      localStorage.setItem(
        "metrologyHistory",
        JSON.stringify(updatedHistory)
      );
    } catch {
      alert("Unable to save history.");
    }
  };

  /* =========================================================
     CLEAR RESULTS
     ========================================================= */

  const clearResults = () => {
    setDistance(null);
    setArea(null);
    setPerimeter(null);
  };

  /* =========================================================
     IMAGE UPLOAD
     ========================================================= */

  const handleImageUpload = (
    url,
    name = ""
  ) => {
    setImage(url);
    setImageName(name);

    clearResults();

    setReferenceDistance(null);
    setReferenceLength("");
    setScale(null);
    setCalibrated(false);
    setAccuracyReference("");

    setMode("calibration");

    setResetKey((previous) => previous + 1);
  };

  /* =========================================================
     CALIBRATION
     ========================================================= */

  const handleCalibration = () => {
    const length = Number(referenceLength);

    if (
      referenceDistance === null ||
      referenceDistance <= 0
    ) {
      alert(
        "Select two different points on the ruler."
      );
      return;
    }

    if (!Number.isFinite(length) || length <= 0) {
      alert("Enter a valid reference length.");
      return;
    }

    const pixelsPerUnit =
      referenceDistance / length;

    setScale(pixelsPerUnit);
    setCalibrated(true);

    clearResults();

    setMode("distance");

    setResetKey((previous) => previous + 1);
  };

  /* =========================================================
     MODE CHANGE
     ========================================================= */

  const handleModeChange = (newMode) => {
    if (!calibrated) {
      alert("Please calibrate the image first.");
      return;
    }

    clearResults();

    setMode(newMode);

    setResetKey((previous) => previous + 1);
  };

  /* =========================================================
     RECALIBRATE
     ========================================================= */

  const handleRecalibrate = () => {
    setCalibrated(false);
    setScale(null);

    setReferenceDistance(null);

    clearResults();

    setAccuracyReference("");

    setMode("calibration");

    setResetKey((previous) => previous + 1);
  };

  /* =========================================================
     RESET MEASUREMENT
     ========================================================= */

  const handleResetMeasurement = () => {
    clearResults();

    setResetKey((previous) => previous + 1);
  };

  /* =========================================================
     CONVERT VALUES
     ========================================================= */

  const distanceValue =
    distance !== null && scale !== null
      ? distance / scale
      : null;

  const areaValue =
    area !== null && scale !== null
      ? area / (scale * scale)
      : null;

  const perimeterValue =
    perimeter !== null && scale !== null
      ? perimeter / scale
      : null;

  /* =========================================================
     MEASUREMENT COMPLETION
     ========================================================= */

  const measurementCompleted =
    (mode === "distance" &&
      distanceValue !== null) ||
    (mode === "area" &&
      areaValue !== null) ||
    (mode === "perimeter" &&
      perimeterValue !== null);

  /* =========================================================
     ACCURACY
     ========================================================= */

  const accuracyReferenceValue =
    Number(accuracyReference);

  let accuracyResult = null;

  if (
    distanceValue !== null &&
    Number.isFinite(accuracyReferenceValue) &&
    accuracyReferenceValue > 0
  ) {
    const absoluteError = Math.abs(
      distanceValue -
        accuracyReferenceValue
    );

    const percentageError =
      (absoluteError /
        accuracyReferenceValue) *
      100;

    accuracyResult = {
      measured: distanceValue,
      reference: accuracyReferenceValue,
      absoluteError,
      percentageError
    };
  }

  const calculatedAccuracy =
    accuracyResult !== null
      ? Math.max(
          0,
          100 - accuracyResult.percentageError
        )
      : null;

  /* =========================================================
     SAVE MEASUREMENT
     ========================================================= */

  const handleSaveMeasurement = () => {
    if (!calibrated) {
      alert("Calibrate the image first.");
      return;
    }

    let value;
    let measurementUnit;
    let type;

    if (mode === "distance") {
      value = distanceValue;
      measurementUnit = unit;
      type = "Distance";
    } else if (mode === "area") {
      value = areaValue;
      measurementUnit = `${unit}²`;
      type = "Area";
    } else if (mode === "perimeter") {
      value = perimeterValue;
      measurementUnit = unit;
      type = "Perimeter";
    } else {
      return;
    }

    if (value === null) {
      alert(
        "Complete a measurement before saving."
      );
      return;
    }

    const record = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      image:
        imageName || "Uploaded image",
      type,
      value: Number(value.toFixed(4)),
      unit: measurementUnit
    };

    saveHistory([
      record,
      ...history
    ]);

    alert(
      "Measurement saved successfully."
    );
  };

  /* =========================================================
     CSV EXPORT
     ========================================================= */

  const handleExportCSV = () => {
    if (history.length === 0) {
      alert(
        "There are no measurements to export."
      );
      return;
    }

    const escapeCSV = (value) =>
      `"${String(value ?? "").replaceAll(
        '"',
        '""'
      )}"`;

    const rows = [
      [
        "Date",
        "Image",
        "Type",
        "Value",
        "Unit"
      ],
      ...history.map((record) => [
        record.date,
        record.image,
        record.type,
        record.value,
        record.unit
      ])
    ];

    const csv = rows
      .map((row) =>
        row.map(escapeCSV).join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "metrology_measurements.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     GENERATE REPORT
     ========================================================= */

  const handleGenerateReport = () => {
    if (!measurementCompleted) {
      alert(
        "Complete a measurement before generating the report."
      );
      return;
    }

    let measurementValue;
    let measurementUnit;
    let measurementType;

    if (mode === "distance") {
      measurementValue =
        distanceValue;

      measurementUnit = unit;

      measurementType =
        "Distance";
    } else if (mode === "area") {
      measurementValue =
        areaValue;

      measurementUnit =
        `${unit}²`;

      measurementType =
        "Area";
    } else {
      measurementValue =
        perimeterValue;

      measurementUnit =
        unit;

      measurementType =
        "Perimeter";
    }

    const reportDate =
      new Date().toLocaleString();

    const referenceText =
      accuracyResult
        ? `${accuracyResult.reference.toFixed(
            2
          )} ${unit}`
        : "Not provided";

    const measuredText =
      measurementValue !== null
        ? `${measurementValue.toFixed(
            2
          )} ${measurementUnit}`
        : "Not available";

    const errorText =
      accuracyResult
        ? `${accuracyResult.absoluteError.toFixed(
            2
          )} ${unit}`
        : "Not calculated";

    const percentageErrorText =
      accuracyResult
        ? `${accuracyResult.percentageError.toFixed(
            2
          )}%`
        : "Not calculated";

    const accuracyText =
      calculatedAccuracy !== null
        ? `${calculatedAccuracy.toFixed(
            2
          )}%`
        : "Not calculated";

    const report = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>
Digital Metrology Measurement Report
</title>

<style>

body {
  margin: 0;
  padding: 40px;

  background: #f1f5f9;

  color: #1e293b;

  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

.report {
  max-width: 850px;

  margin: auto;

  padding: 40px;

  background: white;

  border-radius: 14px;

  box-shadow:
    0 10px 30px
    rgba(15, 23, 42, 0.12);
}

.header {
  padding-bottom: 25px;

  border-bottom:
    2px solid #e2e8f0;
}

.badge {
  display: inline-block;

  padding: 6px 10px;

  color: #0369a1;

  background: #e0f2fe;

  border-radius: 20px;

  font-size: 11px;

  font-weight: bold;

  letter-spacing: 1px;
}

h1 {
  margin: 15px 0 5px;

  color: #0f172a;

  font-size: 30px;
}

.subtitle {
  margin: 0;

  color: #64748b;

  font-size: 14px;
}

.section {
  margin-top: 28px;
}

.section h2 {
  margin-bottom: 14px;

  color: #0f172a;

  font-size: 18px;
}

.grid {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 12px;
}

.card {
  padding: 16px;

  background: #f8fafc;

  border:
    1px solid #e2e8f0;

  border-radius: 9px;
}

.label {
  display: block;

  margin-bottom: 7px;

  color: #64748b;

  font-size: 11px;

  text-transform: uppercase;

  letter-spacing: 0.5px;
}

.value {
  color: #0f172a;

  font-size: 17px;

  font-weight: bold;
}

.main-result {
  padding: 25px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #0369a1,
      #2563eb
    );

  border-radius: 12px;

  text-align: center;
}

.main-result .label {
  color: #dbeafe;
}

.main-result .value {
  color: white;

  font-size: 34px;
}

.accuracy {
  padding: 20px;

  background: #ecfdf5;

  border:
    1px solid #a7f3d0;

  border-radius: 10px;
}

.accuracy strong {
  color: #047857;

  font-size: 28px;
}

.formula {
  padding: 15px;

  color: #475569;

  background: #f8fafc;

  border-left:
    4px solid #2563eb;

  font-size: 13px;

  line-height: 1.6;
}

.limitation {
  padding: 16px;

  color: #78350f;

  background: #fffbeb;

  border:
    1px solid #fde68a;

  border-radius: 9px;

  font-size: 12px;

  line-height: 1.6;
}

.footer {
  margin-top: 35px;

  padding-top: 20px;

  color: #94a3b8;

  border-top:
    1px solid #e2e8f0;

  font-size: 11px;

  text-align: center;
}

@media print {

  body {
    padding: 0;

    background: white;
  }

  .report {
    box-shadow: none;
  }

}

</style>

</head>

<body>

<div class="report">

<div class="header">

<span class="badge">
DIGITAL METROLOGY
</span>

<h1>
Measurement Report
</h1>

<p class="subtitle">
Interactive Digital Metrology Engine
</p>

</div>


<div class="section">

<h2>
Measurement Information
</h2>

<div class="grid">

<div class="card">

<span class="label">
Image
</span>

<div class="value">
${imageName || "Uploaded image"}
</div>

</div>


<div class="card">

<span class="label">
Date & Time
</span>

<div class="value">
${reportDate}
</div>

</div>


<div class="card">

<span class="label">
Measurement Type
</span>

<div class="value">
${measurementType}
</div>

</div>


<div class="card">

<span class="label">
Calibration
</span>

<div class="value">
${referenceLength} ${unit}
</div>

</div>

</div>

</div>


<div class="section">

<h2>
Measurement Result
</h2>

<div class="main-result">

<span class="label">
${measurementType}
</span>

<div class="value">
${measuredText}
</div>

</div>

</div>


<div class="section">

<h2>
Calibration Details
</h2>

<div class="grid">

<div class="card">

<span class="label">
Reference Length
</span>

<div class="value">
${referenceLength} ${unit}
</div>

</div>


<div class="card">

<span class="label">
Reference Pixels
</span>

<div class="value">
${
  referenceDistance !== null
    ? `${referenceDistance.toFixed(
        2
      )} px`
    : "Not available"
}
</div>

</div>


<div class="card">

<span class="label">
Scale
</span>

<div class="value">
${
  scale !== null
    ? `${scale.toFixed(
        2
      )} px/${unit}`
    : "Not available"
}
</div>

</div>


<div class="card">

<span class="label">
Known Reference
</span>

<div class="value">
${referenceText}
</div>

</div>

</div>

</div>


<div class="section">

<h2>
Accuracy / Error Analysis
</h2>

<div class="grid">

<div class="card">

<span class="label">
Measured Value
</span>

<div class="value">
${measuredText}
</div>

</div>


<div class="card">

<span class="label">
Absolute Error
</span>

<div class="value">
${errorText}
</div>

</div>


<div class="card">

<span class="label">
Percentage Error
</span>

<div class="value">
${percentageErrorText}
</div>

</div>


<div class="card">

<span class="label">
Calculated Accuracy
</span>

<div class="value">
${accuracyText}
</div>

</div>

</div>

</div>


${
  accuracyResult
    ? `
<div class="section">

<div class="accuracy">

<span class="label">
Calculated Accuracy
</span>

<strong>
${calculatedAccuracy.toFixed(2)}%
</strong>

</div>

</div>
`
    : ""
}


<div class="section">

<h2>
Calculation Formula
</h2>

<div class="formula">

Percentage Error =
|Measured Value − Reference Value|
÷ Reference Value × 100

<br><br>

Calculated Accuracy =
100 − Percentage Error

</div>

</div>


<div class="section">

<h2>
Measurement Limitation
</h2>

<div class="limitation">

Results depend on calibration,
image quality, camera perspective,
object position, and the accuracy
of point selection. This system is
intended for image-based estimation
and should not be treated as
laboratory-grade metrology equipment.

</div>

</div>


<div class="footer">

Interactive Digital Metrology Engine
· B.Tech Project

</div>

</div>

</body>

</html>
`;

    const blob = new Blob(
      [report],
      {
        type:
          "text/html;charset=utf-8"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `metrology_report_${Date.now()}.html`;

    link.click();

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     DELETE HISTORY
     ========================================================= */

  const handleDeleteRecord = (id) => {
    saveHistory(
      history.filter(
        (record) =>
          record.id !== id
      )
    );
  };

  /* =========================================================
     CLEAR HISTORY
     ========================================================= */

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all saved measurements?"
      )
    ) {
      saveHistory([]);
    }
  };

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="header-badge">
          DIGITAL METROLOGY
        </div>

        <h1>
          Interactive Digital Metrology Engine
        </h1>

        <p>
          Real-World Distance & Area Measuring Tool
        </p>

      </header>


      <main className="main-container">

        {/* UPLOAD */}

        <section className="upload-section">

          <div>

            <h2>
              Upload Image
            </h2>

            <p className="section-description">
              Upload an image containing a reference
              object and the object to measure.
            </p>

          </div>

          <ImageUploader
            onImageUpload={
              handleImageUpload
            }
          />

        </section>


        {/* HOW TO MEASURE */}

        <section className="guide-section">

          <div className="guide-header">

            <div className="guide-icon">
              ?
            </div>

            <div>

              <h2>
                How to Measure
              </h2>

              <p className="section-description">
                Follow these steps for reliable
                image-based measurements.
              </p>

            </div>

          </div>


          <div className="guide-steps">

            <div className="guide-step">

              <span className="step-number">
                1
              </span>

              <div>

                <h3>
                  Upload Image
                </h3>

                <p>
                  Upload an image containing the
                  object and a known reference
                  length.
                </p>

              </div>

            </div>


            <div className="guide-step">

              <span className="step-number">
                2
              </span>

              <div>

                <h3>
                  Calibrate
                </h3>

                <p>
                  Select two points on the reference
                  ruler and enter its known length.
                </p>

              </div>

            </div>


            <div className="guide-step">

              <span className="step-number">
                3
              </span>

              <div>

                <h3>
                  Measure
                </h3>

                <p>
                  Choose Distance, Area, or
                  Perimeter and select the required
                  points.
                </p>

              </div>

            </div>


            <div className="guide-step">

              <span className="step-number">
                4
              </span>

              <div>

                <h3>
                  Save Result
                </h3>

                <p>
                  Review the calculated result and
                  save it to measurement history.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* WORKFLOW */}

        <section className="status-section">

          <div className="status-header">

            <div>

              <h2>
                Measurement Workflow
              </h2>

              <p className="section-description">
                Track the current stage of the
                measurement process.
              </p>

            </div>

            <span className="status-live">
              ● LIVE
            </span>

          </div>


          <div className="workflow">

            <div
              className={`workflow-step ${
                image
                  ? "completed"
                  : "active"
              }`}
            >

              <div className="workflow-number">
                {image ? "✓" : "1"}
              </div>

              <div>

                <strong>
                  Upload
                </strong>

                <span>
                  {image
                    ? "Image uploaded"
                    : "Waiting for image"}
                </span>

              </div>

            </div>


            <div className="workflow-line" />


            <div
              className={`workflow-step ${
                calibrated
                  ? "completed"
                  : image
                  ? "active"
                  : ""
              }`}
            >

              <div className="workflow-number">
                {calibrated ? "✓" : "2"}
              </div>

              <div>

                <strong>
                  Calibrate
                </strong>

                <span>
                  {calibrated
                    ? "Calibration complete"
                    : "Select reference points"}
                </span>

              </div>

            </div>


            <div className="workflow-line" />


            <div
              className={`workflow-step ${
                measurementCompleted
                  ? "completed"
                  : calibrated
                  ? "active"
                  : ""
              }`}
            >

              <div className="workflow-number">
                {measurementCompleted
                  ? "✓"
                  : "3"}
              </div>

              <div>

                <strong>
                  Measure
                </strong>

                <span>
                  {measurementCompleted
                    ? "Measurement complete"
                    : calibrated
                    ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`
                    : "Calibration required"}
                </span>

              </div>

            </div>


            <div className="workflow-line" />


            <div
              className={`workflow-step ${
                history.length > 0
                  ? "completed"
                  : ""
              }`}
            >

              <div className="workflow-number">
                {history.length > 0
                  ? "✓"
                  : "4"}
              </div>

              <div>

                <strong>
                  Save
                </strong>

                <span>
                  {history.length > 0
                    ? `${history.length} measurement${
                        history.length === 1
                          ? ""
                          : "s"
                      } saved`
                    : "Save completed result"}
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* MEASUREMENT */}

        <section className="measurement-section">

          <div className="canvas-container">

            <div className="section-heading">

              <div>

                <h2>
                  Measurement Area
                </h2>

                <p className="section-description">
                  Select points directly on the image.
                </p>

              </div>

              <span className="mode-badge">
                {mode.toUpperCase()}
              </span>

            </div>


            <div className="canvas-placeholder">

              {image ? (

                <MeasurementCanvas
                  image={image}
                  mode={mode}
                  resetKey={resetKey}
                  onDistanceChange={
                    setDistance
                  }
                  onReferenceDistance={
                    setReferenceDistance
                  }
                  onAreaChange={
                    setArea
                  }
                  onPerimeterChange={
                    setPerimeter
                  }
                />

              ) : (

                <div className="empty-canvas">

                  <div className="empty-icon">
                    ↑
                  </div>

                  <p>
                    Upload an image to begin
                    measuring
                  </p>

                </div>

              )}

            </div>

          </div>


          {/* CONTROL PANEL */}

          <div className="control-panel">

            <h2>
              Measurement Tools
            </h2>


            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "distance"
                )
              }
            >
              Distance
            </button>


            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "area"
                )
              }
            >
              Area
            </button>


            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  "perimeter"
                )
              }
            >
              Perimeter
            </button>


            <button
              type="button"
              onClick={
                handleResetMeasurement
              }
              className="reset-button"
              disabled={!calibrated}
            >
              Reset Measurement
            </button>


            <div className="current-mode">

              <span>
                Current Mode
              </span>

              <strong>
                {mode.charAt(0).toUpperCase() +
                  mode.slice(1)}
              </strong>

            </div>


            <hr />


            <h3>
              Calibration
            </h3>


            <label htmlFor="reference-length">
              Reference Length
            </label>

            <input
              id="reference-length"
              type="number"
              min="0"
              step="any"
              value={referenceLength}
              placeholder="Enter known length"
              onChange={(event) =>
                setReferenceLength(
                  event.target.value
                )
              }
            />


            <select
              value={unit}
              onChange={(event) => {

                if (calibrated) {
                  handleRecalibrate();
                }

                setUnit(
                  event.target.value
                );

              }}
            >

              <option value="cm">
                Centimeters (cm)
              </option>

              <option value="mm">
                Millimeters (mm)
              </option>

              <option value="m">
                Meters (m)
              </option>

              <option value="inch">
                Inches
              </option>

              <option value="ft">
                Feet
              </option>

            </select>


            <button
              type="button"
              onClick={
                handleCalibration
              }
              disabled={
                mode !== "calibration"
              }
            >
              Calibrate Image
            </button>


            {calibrated && (

              <button
                type="button"
                onClick={
                  handleRecalibrate
                }
                className="secondary-button"
              >
                Recalibrate
              </button>

            )}


            {referenceDistance !== null && (

              <div className="info-box">

                <span>
                  Reference Pixels
                </span>

                <strong>
                  {referenceDistance.toFixed(
                    2
                  )}{" "}
                  px
                </strong>

              </div>

            )}


            {calibrated &&
              scale !== null && (

              <div className="success-box">

                <strong>
                  ✓ Calibration Successful
                </strong>

                <p>
                  Scale:{" "}
                  {scale.toFixed(2)}{" "}
                  px/{unit}
                </p>

              </div>

            )}

          </div>

        </section>


        {/* RESULTS */}

        <section className="result-section">

          <div className="section-heading">

            <div>

              <h2>
                Measurement Results
              </h2>

              <p className="section-description">
                Current calculated values.
              </p>

            </div>

          </div>


          <div className="results-grid">

            <div className="result-box">

              <span>
                Distance
              </span>

              <strong>
                {distanceValue !== null
                  ? `${distanceValue.toFixed(
                      2
                    )} ${unit}`
                  : "--"}
              </strong>

            </div>


            <div className="result-box">

              <span>
                Area
              </span>

              <strong>
                {areaValue !== null
                  ? `${areaValue.toFixed(
                      2
                    )} ${unit}²`
                  : "--"}
              </strong>

            </div>


            <div className="result-box">

              <span>
                Perimeter
              </span>

              <strong>
                {perimeterValue !== null
                  ? `${perimeterValue.toFixed(
                      2
                    )} ${unit}`
                  : "--"}
              </strong>

            </div>

          </div>


          <button
            type="button"
            onClick={
              handleSaveMeasurement
            }
            className="save-button"
            disabled={!measurementCompleted}
          >
            Save Measurement
          </button>


          <button
            type="button"
            onClick={
              handleGenerateReport
            }
            className="report-button"
            disabled={!measurementCompleted}
          >
            Generate Measurement Report
          </button>

        </section>


        {/* ACCURACY */}

        <section className="accuracy-section">

          <h2>
            Accuracy / Error Analysis
          </h2>

          <p className="section-description">
            Compare the measured distance
            with a known reference value.
          </p>


          <label htmlFor="accuracy-reference">
            Known Reference Value
          </label>


          <input
            id="accuracy-reference"
            type="number"
            min="0.0001"
            step="any"
            value={accuracyReference}
            placeholder={`Enter value in ${unit}`}
            onChange={(event) => {

              const value =
                event.target.value;

              if (
                value === "" ||
                Number(value) > 0
              ) {
                setAccuracyReference(
                  value
                );
              }

            }}
          />


          <p className="accuracy-hint">
            Enter the actual known distance
            in {unit} to compare it with the
            measured value.
          </p>


          {accuracyResult ? (

            <>

              <div className="accuracy-results">

                <div className="accuracy-card">

                  <span>
                    Reference Value
                  </span>

                  <strong>
                    {accuracyResult.reference.toFixed(
                      2
                    )}{" "}
                    {unit}
                  </strong>

                </div>


                <div className="accuracy-card">

                  <span>
                    Measured Value
                  </span>

                  <strong>
                    {accuracyResult.measured.toFixed(
                      2
                    )}{" "}
                    {unit}
                  </strong>

                </div>


                <div className="accuracy-card">

                  <span>
                    Absolute Error
                  </span>

                  <strong>
                    {accuracyResult.absoluteError.toFixed(
                      2
                    )}{" "}
                    {unit}
                  </strong>

                </div>


                <div className="accuracy-card">

                  <span>
                    Percentage Error
                  </span>

                  <strong>
                    {accuracyResult.percentageError.toFixed(
                      2
                    )}%
                  </strong>

                </div>

              </div>


              <div className="accuracy-summary">

                <div className="accuracy-summary-label">
                  Calculated Accuracy
                </div>

                <div className="accuracy-percentage">
                  {calculatedAccuracy.toFixed(
                    2
                  )}%
                </div>

                <p>
                  Calculated from the difference
                  between the measured value and
                  the known reference.
                </p>

              </div>


              <div className="accuracy-formula">

                <strong>
                  Error Formula
                </strong>

                <p>
                  Percentage Error =
                  |Measured Value − Reference Value|
                  ÷ Reference Value × 100
                </p>

              </div>

            </>

          ) : (

            <div className="accuracy-empty">

              <div className="accuracy-empty-icon">
                %
              </div>

              <div>

                <strong>
                  Waiting for measurement
                </strong>

                <p>
                  Complete a distance measurement
                  and enter the known reference
                  value to calculate error and
                  accuracy.
                </p>

              </div>

            </div>

          )}

        </section>


        {/* HISTORY */}

        <section className="history-section">

          <div className="section-heading">

            <div>

              <h2>
                Measurement History
              </h2>

              <p className="section-description">
                Saved measurements are stored
                locally in your browser.
              </p>

            </div>


            <span className="history-count">
              {history.length} saved
            </span>

          </div>


          <div className="history-actions">

            <button
              type="button"
              onClick={
                handleExportCSV
              }
              disabled={
                history.length === 0
              }
            >
              Export CSV
            </button>


            <button
              type="button"
              onClick={
                handleClearHistory
              }
              disabled={
                history.length === 0
              }
              className="danger-button"
            >
              Clear History
            </button>

          </div>


          {history.length === 0 ? (

            <div className="empty-history">

              <p>
                No saved measurements yet.
              </p>

            </div>

          ) : (

            <div className="history-table-wrapper">

              <table className="history-table">

                <thead>

                  <tr>

                    <th>
                      Date
                    </th>

                    <th>
                      Image
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Value
                    </th>

                    <th>
                      Unit
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {history.map(
                    (record) => (

                      <tr key={record.id}>

                        <td>
                          {record.date}
                        </td>

                        <td>

                          <span
                            className="history-image-name"
                            title={record.image}
                          >
                            {record.image}
                          </span>

                        </td>

                        <td>

                          <span className="type-badge">
                            {record.type}
                          </span>

                        </td>

                        <td>
                          {record.value}
                        </td>

                        <td>
                          {record.unit}
                        </td>

                        <td>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteRecord(
                                record.id
                              )
                            }
                            className="delete-button"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* INFORMATION */}

        <section className="info-section">

          <div className="info-header">

            <div className="info-icon">
              i
            </div>

            <div>

              <h2>
                About Digital Metrology
              </h2>

              <p className="section-description">
                Image-based real-world measurement
                system.
              </p>

            </div>

          </div>


          <div className="info-grid">

            <div>

              <h3>
                Calibration
              </h3>

              <p>
                A known reference length establishes
                the relationship between image pixels
                and real-world units.
              </p>

            </div>


            <div>

              <h3>
                Distance
              </h3>

              <p>
                Calculates straight-line distance
                between two selected points.
              </p>

            </div>


            <div>

              <h3>
                Area
              </h3>

              <p>
                Calculates the area of a polygon
                formed by selected points.
              </p>

            </div>


            <div>

              <h3>
                Perimeter
              </h3>

              <p>
                Calculates the boundary length
                of the selected polygon.
              </p>

            </div>

          </div>


          <div className="limitation-box">

            <strong>
              Measurement Limitation
            </strong>

            <p>
              Results depend on calibration,
              image quality, camera perspective,
              object position, and point-selection
              accuracy. This system is intended
              for image-based estimation and should
              not be treated as laboratory-grade
              metrology equipment.
            </p>

          </div>

        </section>

      </main>


      <footer className="footer">

        Interactive Digital Metrology Engine

        <span>
          •
        </span>

        Computer Vision Project

      </footer>

    </div>
  );
}

export default App;
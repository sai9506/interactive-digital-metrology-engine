import { useRef, useState } from "react";

function ImageUploader({ onImageUpload }) {
  const inputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const processFile = (file) => {
    setError("");

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Image size must be less than 10 MB."
      );
      return;
    }

    const imageUrl =
      URL.createObjectURL(file);

    setFileName(file.name);
    setPreview(imageUrl);

    onImageUpload(imageUrl);
  };

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    processFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    processFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();

    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleBrowse = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setFileName("");
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="image-uploader">

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input"
      />

      {!preview ? (

        <div
          className={`upload-dropzone ${
            dragging ? "dragging" : ""
          }`}
          onClick={handleBrowse}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              handleBrowse();
            }
          }}
        >

          <div className="upload-icon">
            ↑
          </div>

          <h3>
            Upload Measurement Image
          </h3>

          <p>
            Drag & drop an image here
          </p>

          <span>
            or click to browse
          </span>

          <div className="upload-formats">
            JPG · JPEG · PNG · WEBP
            <br />
            Maximum size: 10 MB
          </div>

        </div>

      ) : (

        <div className="uploaded-file-card">

          <div className="uploaded-preview">

            <img
              src={preview}
              alt="Uploaded measurement"
            />

          </div>


          <div className="uploaded-file-info">

            <span className="uploaded-label">
              IMAGE READY
            </span>

            <strong
              title={fileName}
            >
              {fileName}
            </strong>

            <p>
              Ready for calibration
              and measurement.
            </p>

          </div>


          <div className="upload-actions">

            <button
              type="button"
              onClick={handleBrowse}
              className="replace-image-button"
            >
              Replace
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="remove-image-button"
            >
              Remove
            </button>

          </div>

        </div>

      )}


      {error && (

        <div className="upload-error">
          ⚠ {error}
        </div>

      )}

    </div>
  );
}

export default ImageUploader;
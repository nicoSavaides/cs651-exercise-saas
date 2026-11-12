
const express = require("express");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new Error("Please upload an image."));
    }
  },
});

const client = new vision.ImageAnnotatorClient();

app.use(express.static(path.join(__dirname, "public")));

app.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please select an image." });
  }

  try {
    const [result] = await client.labelDetection({
      image: { content: req.file.buffer },
    });

    const labels = (result.labelAnnotations || []).map((label) => ({
      name: label.description,
      confidence: Math.round((label.score || 0) * 100),
    }));

    res.json({ labels });
  } catch (error) {
    console.error("Vision API error:", error);
    res.status(500).json({
      error: "Image analysis failed. Check your Google Cloud configuration.",
    });
  }
});

app.use((error, req, res, next) => {
  res.status(400).json({ error: error.message });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// server/ultra-minimal.ts
import express from "express";
import path from "path";
var app = express();
app.use(express.json());
app.use(express.static("dist/public"));
app.get("/health", (req, res) => {
  res.json({ status: "ok", server: "ultra-minimal" });
});
app.get("/api/test", (req, res) => {
  res.json({ message: "Ultra minimal server working" });
});
app.get("*", (req, res) => {
  res.sendFile(path.resolve("dist/public/index.html"));
});
var port = process.env.PORT || 5e3;
app.listen(port, "0.0.0.0", () => {
  console.log(`Ultra minimal server running on port ${port}`);
});
var ultra_minimal_default = app;
export {
  ultra_minimal_default as default
};

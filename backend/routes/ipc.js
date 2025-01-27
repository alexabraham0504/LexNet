const express = require("express");
const router = express.Router();
const IPCSection = require("../models/IPCSection"); // Adjust the path as necessary
const axios = require("axios");
const cheerio = require("cheerio");

// @route GET /api/ipc
// @desc Get all IPC sections
router.get("/", async (req, res) => {
  try {
    const sections = await IPCSection.find();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/ipc
// @desc Add a new IPC section
router.post("/", async (req, res) => {
  const { section, description, caseStudy } = req.body;

  if (!section || !description) {
    return res
      .status(400)
      .json({ message: "Section and description are required" });
  }

  const newSection = new IPCSection({
    section,
    description,
    caseStudy: caseStudy || "",
  });

  try {
    const savedSection = await newSection.save();
    res.status(201).json(savedSection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/ipc/:id
// @desc Delete an IPC section by ID
router.delete("/:id", async (req, res) => {
  try {
    console.log("IPCSection:", IPCSection); // Log IPCSection to check if it's defined

    const sectionId = req.params.id;

    // Use findByIdAndDelete instead
    const deletedSection = await IPCSection.findByIdAndDelete(sectionId);

    // Check if the section was found and deleted
    if (!deletedSection) {
      return res.status(404).json({ message: "Section not found" });
    }

    res.json({ message: "Section removed" });
  } catch (error) {
    console.error("Error deleting IPC section:", error); // Log the entire error object
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route GET /api/ipc/fetch-wikipedia
// @desc Fetch IPC sections and case studies from Wikipedia
router.get("/fetch-wikipedia", async (req, res) => {
  try {
    const response = await axios.get(
      "https://en.wikipedia.org/wiki/Indian_Penal_Code"
    );
    const html = response.data;

    const $ = cheerio.load(html);
    const ipcSections = [];

    // Example: Adjust the selector based on the actual structure of the Wikipedia page
    $("table.wikitable tbody tr").each((index, element) => {
      const section = $(element).find("td").eq(0).text().trim();
      const description = $(element).find("td").eq(1).text().trim();
      const caseStudy = $(element).find("td").eq(2).text().trim(); // Adjust based on actual structure

      if (section && description) {
        ipcSections.push({ section, description, caseStudy });
      }
    });

    // Save to MongoDB
    if (ipcSections.length > 0) {
      await IPCSection.insertMany(ipcSections);
      res
        .status(200)
        .json({
          message: "IPC sections fetched and saved successfully",
          ipcSections,
        });
    } else {
      res.status(404).json({ message: "No IPC sections found" });
    }
  } catch (error) {
    console.error("Error fetching IPC sections from Wikipedia:", error.message);
    res
      .status(500)
      .json({ message: "Failed to fetch IPC sections", error: error.message });
  }
});

module.exports = router;

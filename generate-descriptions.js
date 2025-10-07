import fs from "fs";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config(); // Load .env file

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Your posts folder — adjust to match your structure
const POSTS_DIR = "./src/posts";

async function generateDescription(content, filename) {
  const prompt = `
Summarize the following blog post into a short, engaging English description (no more than 30 words).  
It should read naturally and attract readers, suitable for the 'description' field in front matter.

Post content:
${content.slice(0, 4000)}
  `;

  console.log(`🧠 Sending "${filename}" to Gemini...`);
  const result = await model.generateContent(prompt);
  return result.response.text().trim().replace(/^"|"$/g, ""); // clean quotes if any
}

async function processPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    if (data.description && data.description.trim() !== "") {
      console.log(`✅ Skipping "${file}" — already has description.`);
      continue;
    }

    try {
      const description = await generateDescription(content, file);
      const updated = matter.stringify(content, { ...data, description });
      fs.writeFileSync(filePath, updated);
      console.log(`✨ Added description to "${file}".`);
    } catch (err) {
      console.error(`❌ Failed to process "${file}":`, err.message);
    }
  }

  console.log("🏁 Done! All missing descriptions have been generated.");
}

processPosts();

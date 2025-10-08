import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';
import embedEverything from 'eleventy-plugin-embed-everything';

const processor = postcss([
  tailwindcss(),
  cssnano({
    preset: 'default',
  }),
]);

export default function (eleventyConfig) {
  // Add the embed plugin for YouTube and other embeds
  eleventyConfig.addPlugin(embedEverything, {
    youtube: {
      options: {
        allowFullscreen: true
      }
    }
  });

  // Process Tailwind CSS before each Eleventy build
  eleventyConfig.on('eleventy.before', async () => {
    const tailwindInputPath = path.resolve('./src/css/input.css');
    const tailwindOutputPath = './_site/css/styles.css';
    const cssContent = fs.readFileSync(tailwindInputPath, 'utf8');
    const outputDir = path.dirname(tailwindOutputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const result = await processor.process(cssContent, {
      from: tailwindInputPath,
      to: tailwindOutputPath,
    });
    
    fs.writeFileSync(tailwindOutputPath, result.css);
  });

  // Add filter to strip HTML tags
  eleventyConfig.addFilter("striptags", function(content) {
    return (content || "")
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  });

  // Add a collection for blog posts, sorted by date descending
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // Add date filter for formatting
  eleventyConfig.addFilter("dateFormat", function(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Add RSS date filter
  eleventyConfig.addFilter("dateToRfc822", function(date) {
    return new Date(date).toUTCString();
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    pathPrefix: process.env.ELEVENTY_ENV === 'production' ? '/spark/' : '/'
  };
}
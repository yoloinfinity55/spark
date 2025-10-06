import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';

const processor = postcss([
  tailwindcss(),
  cssnano({
    preset: 'default',
  }),
]);

export default function (eleventyConfig) {
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

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    },
    // Add pathPrefix - uses /spark/ for production, / for local development
    pathPrefix: process.env.ELEVENTY_ENV === 'production' ? '/spark/' : '/'
  };
}
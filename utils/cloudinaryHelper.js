// This function extracts image public IDs from Cloudinary image URLs inside a text (like product.description)
function extractPublicIds(description) {
  // Regex to match Cloudinary image URLs and capture the public ID part
  // Explanation of regex:
  // https:\/\/res\.cloudinary\.com\/  => matches the start of Cloudinary URL exactly
  // [^/]+\/image\/upload\/          => matches any cloud name + /image/upload/
  // [^"]+\/                        => matches the version or transformations folder (anything except a quote)
  // ([^".]+)                       => CAPTURE group for public ID (anything except dot or quote)
  // \.[a-z]+                       => matches the file extension like .jpg, .png etc.
  const regex = /\/upload\/[^/]+\/([^".]+)\.[a-z]+/g;

  // This array will store the extracted public IDs
  const ids = [];

  let match; // Will hold the result of each regex match

  // Loop through all matches of the regex in the description text
  while ((match = regex.exec(description))) {
    // match[0] is the full matched URL
    // match[1] contains the public ID captured by the parentheses part in the regex
    // Example:
    // For URL "https://res.cloudinary.com/demo/image/upload/v1234567890/sample-image.jpg"
    // match[0] = "https://res.cloudinary.com/demo/image/upload/v1234567890/sample-image.jpg"
    // match[1] = "sample-image"
    ids.push(match[1]);
  }

  // Return the list of public IDs found in the description
  return ids;
}

module.exports = { extractPublicIds };


/* 

Example usage:

const descriptionText = `
  Here are some images:
  https://res.cloudinary.com/demo/image/upload/v1234567890/sample-image.jpg
  and another one
  https://res.cloudinary.com/demo/image/upload/v9876543210/another-image.png
`;

const publicIds = extractPublicIds(descriptionText);

console.log(publicIds);
// Output will be:
// [ 'sample-image', 'another-image' ]

Explanation:
- The regex finds both URLs in the text.
- It extracts "sample-image" and "another-image" as public IDs.
- These IDs can then be used to delete or manipulate images on Cloudinary.

*/

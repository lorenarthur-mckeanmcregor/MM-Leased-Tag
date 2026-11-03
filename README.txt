MM Leased Tag (v1)

What it does: takes a listing image address and returns the same image with an orange LEASED tag in the top left corner. The sold and leased catalogue uses it for leased and rent listings only.

Address format: https://YOUR-ADDRESS.vercel.app/leased.jpg?u=<image address, URL encoded>

Only images from rexsoftware.com addresses are allowed. Anything else returns an error.

Tag design: the drawn tag matches the example Loren supplied (orange F4930F, white block letters, top left, 28.6 percent of the image width). To use the exact custom design instead, add a file named tag.png (transparent background, any size) at the top of the repo next to package.json. If tag.png exists it is used. Nothing else changes.

Files: package.json, vercel.json, api/leased.js. Keep api and package.json at the top level of the repo.
No keys or passwords are used.

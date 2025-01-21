Ohhh1Cloud



Overview
Ohhh1Cloud is a powerful and intuitive cloud-based application designed to manage and display your media files with seamless integration from Google Drive, Dropbox, and local storage. Whether you're setting up a digital photo frame or an interactive slideshow, Ohhh1Cloud provides a user-friendly interface with customizable options.

Features
📂 Multi-Cloud Integration – Connect and access files from Google Drive and Dropbox.
🖼️ Slideshow Mode – Seamless slideshow playback with custom transition effects.
🔒 Secure Storage – Data encryption and secure API interactions.
🎨 Responsive UI – Optimized for all devices, from mobile to desktop.
⚡ Fast Performance – Efficient caching strategies to speed up media access.
📑 Customizable Settings – Tailor the experience to your preference with user-friendly options.
Installation
Prerequisites
Before running Ohhh1Cloud, ensure you have the following installed:

Node.js (v16+ recommended)
Git
Package Manager (npm or yarn)
Steps to Set Up Locally
Clone the repository:

bash
Copy
Edit
git clone https://github.com/johnohhh1/ohhh1cloud.git
cd ohhh1cloud
Install dependencies:

bash
Copy
Edit
npm install
Create an .env file and configure environment variables (based on .env.example).

Start the development server:

bash
Copy
Edit
npm run dev
Open the app in your browser at http://localhost:8080 (or whatever your is set to 3000).

Usage
Connecting Your Cloud Accounts

Navigate to the settings page to authenticate with Google Drive or Dropbox.
Uploading Files

Drag and drop files or select them from your local storage.
Managing Slideshows

Customize slideshow transitions and playback duration.
Configuration
Modify the vite.config.js and tailwind.config.js files to adjust build and styling options.

Project Structure
graphql
Copy
Edit
ohhh1cloud/
│-- .vscode/               # VS Code settings  
│-- docs/                  # Documentation files  
│-- src/                   # Application source code  
│   ├── components/        # Reusable UI components  
│   ├── services/          # Cloud API integrations  
│   ├── utils/             # Helper functions  
│-- public/                # Static assets  
│-- package.json           # Project dependencies  
│-- tailwind.config.js      # Tailwind CSS config  
│-- vite.config.js          # Vite project config  
Contributing
We welcome contributions to improve Ohhh1Cloud!
To contribute:

Fork the repository.
Create a feature branch (git checkout -b feature-xyz).
Commit your changes (git commit -m "Add feature xyz").
Push to your fork and open a pull request.
Issues & Feedback
If you encounter any issues or have suggestions, please open an issue.

License
This project is licensed under the MIT License – see the LICENSE file for details.

Acknowledgments
Special thanks to all contributors and supporters of the project.

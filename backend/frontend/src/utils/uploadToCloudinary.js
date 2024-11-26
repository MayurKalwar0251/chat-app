import axios from "axios";

export const uploadToCloudinary = async ({ file }) => {
  if (!file) return alert("No Data Send!");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "media_upload_preset"); // Replace with your preset
  formData.append("cloud_name", "dfiw6zwz0"); // Replace with your cloud name

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/dfiw6zwz0/upload`,
      formData
    );

    const uploadedUrl = response.data.secure_url;
    console.log("Uploaded Audio URL:", uploadedUrl);
    return uploadedUrl;
  } catch (error) {
    console.error("Error uploading File:", error);
    alert("Failed to upload File!");
  }
};

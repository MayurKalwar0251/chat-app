import React, { useRef } from "react";
import { Upload, X, ImageIcon, Film, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const SendImageVideo = ({ files, setFiles, fileType, setFileType }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setFiles(newFiles);
  };

  const removeFile = (fileToRemove) => {
    setFiles(files.filter((file) => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const handleUpload = async () => {
    // TODO: Implement Cloudinary upload logic here
    console.log("Uploading files to Cloudinary:", files);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleTypeSelect = (type) => {
    setFileType(type);
    setFiles([]);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            {fileType === "image" ? (
              <ImageIcon className="mr-2 h-4 w-4" />
            ) : (
              <Film className="mr-2 h-4 w-4" />
            )}
            Select {fileType === "image" ? "Images" : "Video"}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full">
          <DropdownMenuItem onClick={() => handleTypeSelect("image")}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Images
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTypeSelect("video")}>
            <Film className="mr-2 h-4 w-4" />
            Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept={fileType === "image" ? "image/*" : "video/*"}
        multiple={fileType === "image"}
      />

      <Button onClick={triggerFileInput} className="w-full">
        {fileType === "image" ? "Select Images" : "Select Video"}
      </Button>

      {files.length > 0 && (
        <div className="w-full flex gap-2 overflow-x-auto">
          {files.map((file, index) => (
            <div key={index} className="relative group flex-shrink-0">
              {file.type.startsWith("image/") ? (
                <img
                  src={file.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <video
                  src={file.preview}
                  className="w-16 h-16 rounded-lg object-cover"
                  controls
                />
              )}
              <button
                onClick={() => removeFile(file)}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SendImageVideo;

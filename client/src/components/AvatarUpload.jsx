import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Check, X, ZoomIn, ZoomOut } from 'lucide-react';

const AvatarUpload = ({ currentAvatar, onAvatarChange }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Define target size (max 800x800)
    const MAX_SIZE = 800;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
      if (targetWidth > targetHeight) {
        targetHeight = (MAX_SIZE / targetWidth) * targetHeight;
        targetWidth = MAX_SIZE;
      } else {
        targetWidth = (MAX_SIZE / targetHeight) * targetWidth;
        targetHeight = MAX_SIZE;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.85); // Slightly lower quality to save bandwidth
    });
  };

  const handleSaveCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onAvatarChange(croppedImage);
      setShowCropper(false);
      setImageSrc(null);
    } catch (e) {
      console.error('Error cropping image:', e);
      alert('Failed to crop image');
    }
  };

  const handleCancel = () => {
    setShowCropper(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="space-y-6">
      {/* Preview and Upload Section */}
      <div className="flex items-start gap-6">
        {/* Avatar Preview */}
        <div className="relative group">
          <div className="h-28 w-28 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-border shadow-lg ring-4 ring-background transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Upload size={28} strokeWidth={1.5} />
                <span className="text-[10px] mt-1 font-medium">No Image</span>
              </div>
            )}
          </div>
          {currentAvatar && (
            <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-md border-2 border-background">
              <Check size={16} className="text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>
        
        {/* Upload Button and Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Profile Picture</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a professional photo that represents you. This will be visible across your profile.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
              <Upload size={16} strokeWidth={2.5} />
              <span className="text-sm">Choose Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
              <span className="font-medium">JPG, PNG, WebP</span>
              <span className="text-border">•</span>
              <span>Max 5MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Adjust Your Photo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Drag to reposition, use the slider to zoom</p>
              </div>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cropper Area */}
            <div className="relative h-[28rem] bg-background/50">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Controls */}
            <div className="px-6 py-5 space-y-5 border-t border-border bg-muted/20">
              {/* Zoom Slider */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zoom Level</label>
                <div className="flex items-center gap-4">
                  <ZoomOut size={18} className="text-muted-foreground flex-shrink-0" strokeWidth={2} />
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
                    />
                  </div>
                  <ZoomIn size={18} className="text-muted-foreground flex-shrink-0" strokeWidth={2} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-all duration-200 text-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCrop}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg text-sm active:scale-95"
                >
                  <Check size={18} strokeWidth={2.5} />
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;

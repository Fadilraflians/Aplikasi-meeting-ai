import React, { useState } from 'react';
import { Page, type MeetingRoom } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';
import InJourneyPattern from '../components/InJourneyPattern';

interface AddRoomPageProps {
  onNavigate: (page: Page) => void;
  onRoomAdded: (room: MeetingRoom) => void;
}

const AddRoomPage: React.FC<AddRoomPageProps> = ({ onNavigate, onRoomAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    address: '',
    facilities: '',
    image_url: ''
  });
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Available facilities list (same as EditRoomPage)
  const availableFacilities = [
    'AC', 'Projector', 'Sound System', 'Whiteboard', 'TV', 'WiFi',
    'Microphone', 'Camera', 'Flipchart', 'Coffee Machine', 'Water Dispenser',
    'Printer', 'Scanner', 'Video Conference', 'Presentation Screen',
    'Laptop Connection', 'Power Outlets', 'Air Purifier', 'Blinds/Curtains', 'Lighting Control'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacilityChange = (facility: string) => {
    setSelectedFacilities(prev => {
      const newFacilities = prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility];
      
      // Update formData.facilities to match selectedFacilities
      setFormData(prevForm => ({
        ...prevForm,
        facilities: newFacilities.join(', ')
      }));
      
      return newFacilities;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Upload file immediately
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://127.0.0.1:8080/api/upload-room-image.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          image_url: result.imageUrl
        }));
      } else {
        setError(result.message || 'Gagal mengupload gambar');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Terjadi kesalahan saat mengupload gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.name.trim()) {
      setError('Nama ruangan harus diisi');
      return;
    }
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      setError('Kapasitas harus lebih dari 0');
      return;
    }
    if (!formData.address.trim()) {
      setError('Alamat harus diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const roomData = {
        name: formData.name.trim(),
        capacity: parseInt(formData.capacity),
        address: formData.address.trim(),
        facilities: selectedFacilities,
        image_url: formData.image_url || '/images/meeting-rooms/default-room.jpg'
      };

      const result = await ApiService.createRoom(roomData);
      
      console.log('Create room result:', result);
      
      if (result && (result.status === 'success' || result.success)) {
        setSuccess(true);
        // Simpan data ruangan yang baru dibuat
        const newRoom: MeetingRoom = {
          id: result.data?.id || result.id || Date.now(), // Fallback ID
          name: roomData.name,
          floor: '-', // Default value since floor is removed
          capacity: roomData.capacity,
          address: roomData.address,
          facilities: roomData.facilities,
          image: roomData.image_url
        };
        
        onRoomAdded(newRoom);
        
        // Reset form
        setFormData({
          name: '',
          capacity: '',
          address: '',
          facilities: '',
          image_url: ''
        });
        setSelectedFacilities([]);
        setSelectedFile(null);
        
        // Navigate back after 2 seconds
        setTimeout(() => {
          onNavigate(Page.MeetingRooms);
        }, 2000);
      } else {
        const errorMessage = result?.message || 'Gagal menambahkan ruangan';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Terjadi kesalahan saat menambahkan ruangan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 relative">
      {/* InJourney Pattern Background */}
      <InJourneyPattern className="opacity-15" />
      
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => onNavigate(Page.MeetingRooms)} 
                className="mr-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <BackArrowIcon />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tambah Ruangan Baru</h1>
                <p className="text-gray-600 text-sm mt-1">Tambahkan ruangan meeting baru ke sistem</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">

            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                <div>
                  <p className="font-semibold">Ruangan berhasil ditambahkan!</p>
                  <p className="text-sm text-green-600">Mengarahkan kembali ke halaman Meeting Rooms...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">!</div>
                <div>
                  <p className="font-semibold">Terjadi Kesalahan</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Nama Ruangan *
                    </span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                    placeholder="Masukkan nama ruangan"
                    disabled={loading}
                  />
                </div>


                <div>
                  <label htmlFor="capacity" className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Kapasitas *
                    </span>
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                    placeholder="Masukkan kapasitas ruangan"
                    min="1"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Alamat/Building *
                  </span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                  placeholder="Masukkan alamat atau nama building"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Fasilitas
                  </span>
                </label>
                <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Pilih fasilitas yang tersedia di ruangan meeting ini
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableFacilities.map((facility) => (
                      <label key={facility} className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-sm">
                        <input
                          type="checkbox"
                          checked={selectedFacilities.includes(facility)}
                          onChange={() => handleFacilityChange(facility)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          disabled={loading}
                        />
                        <span className="text-sm font-medium text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                  {selectedFacilities.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Fasilitas yang dipilih ({selectedFacilities.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFacilities.map((facility) => (
                          <span key={facility} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {facility}
                            <button
                              type="button"
                              onClick={() => handleFacilityChange(facility)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                              disabled={loading}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-dashed border-gray-300">
                <label htmlFor="image_upload" className="block text-sm font-semibold text-gray-700 mb-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    Gambar Ruangan
                  </span>
                </label>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="image_upload"
                      name="image_upload"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:transition-colors file:duration-200"
                      disabled={loading || uploadingImage}
                    />
                  </div>
                  
                  {uploadingImage && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700 font-medium">Mengupload gambar...</span>
                    </div>
                  )}
                  
                  {selectedFile && !uploadingImage && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                      <span className="text-green-700 font-medium">Gambar berhasil diupload: {selectedFile.name}</span>
                    </div>
                  )}
                  
                  {formData.image_url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="relative inline-block">
                        <img 
                          src={formData.image_url} 
                          alt="Preview" 
                          className="w-40 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          ✓
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                  <span className="text-blue-500">📷</span>
                  Format yang didukung: JPG, PNG, GIF, WebP. Maksimal 5MB.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => onNavigate(Page.MeetingRooms)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>↩️</span>
                    Batal
                  </span>
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <span>➕</span>
                        Tambah Ruangan
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRoomPage;

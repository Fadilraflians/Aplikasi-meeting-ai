import React, { useState, useEffect } from 'react';
import { Page, type MeetingRoom } from '../types';
import { BackArrowIcon } from '../components/icons';
import { ApiService } from '../src/config/api';

interface EditRoomPageProps {
  onNavigate: (page: Page) => void;
  room: MeetingRoom | null;
  onRoomUpdated: (updatedRoom: MeetingRoom) => void;
}

const EditRoomPage: React.FC<EditRoomPageProps> = ({ onNavigate, room, onRoomUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    floor: '',
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

  // Available facilities list (same as BookingFormPage)
  const availableFacilities = [
    'AC', 'Projector', 'Sound System', 'Whiteboard', 'TV', 'WiFi',
    'Microphone', 'Camera', 'Flipchart', 'Coffee Machine', 'Water Dispenser',
    'Printer', 'Scanner', 'Video Conference', 'Presentation Screen',
    'Laptop Connection', 'Power Outlets', 'Air Purifier', 'Blinds/Curtains', 'Lighting Control'
  ];

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        floor: room.floor || '',
        capacity: room.capacity?.toString() || '',
        address: room.address || '',
        facilities: room.facilities?.join(', ') || '',
        image_url: room.image || ''
      });
      setSelectedFacilities(room.facilities || []);
    }
  }, [room]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    
    if (!room) {
      setError('Data ruangan tidak ditemukan');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        id: room.id,
        name: formData.name.trim(),
        floor: formData.floor.trim(),
        capacity: parseInt(formData.capacity) || 0,
        address: formData.address.trim(),
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean),
        image_url: formData.image_url.trim()
      };

      // Call API to update room
      console.log('Sending update data:', updateData);
      const response = await ApiService.updateRoom(updateData);
      console.log('API response:', response);
      
      if (response && (response.status === 'success' || response.success)) {
        setSuccess(true);
        
        // Update the room data
        const updatedRoom: MeetingRoom = {
          ...room,
          name: updateData.name,
          floor: updateData.floor,
          capacity: updateData.capacity,
          address: updateData.address,
          facilities: updateData.facilities,
          image: updateData.image_url || room.image
        };
        
        onRoomUpdated(updatedRoom);
        
        // Show success message and navigate back after 2 seconds
        setTimeout(() => {
          onNavigate(Page.RoomDetail);
        }, 2000);
      } else {
        const errorMessage = response?.message || 'Gagal memperbarui informasi ruangan';
        console.error('Update room error:', response);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error updating room:', err);
      setError('Terjadi kesalahan saat memperbarui informasi ruangan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onNavigate(Page.RoomDetail);
  };

  if (!room) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ruangan Tidak Ditemukan</h2>
          <button 
            onClick={() => onNavigate(Page.MeetingRooms)}
            className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition"
          >
            Kembali ke Daftar Ruangan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={handleCancel} 
                className="mr-6 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <BackArrowIcon />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit Ruangan</h1>
                <p className="text-gray-600 text-sm mt-1">Ubah informasi ruangan meeting</p>
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
          ✅ Informasi ruangan berhasil diperbarui! Mengarahkan kembali...
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          ❌ {error}
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
                    required
                    placeholder="Masukkan nama ruangan"
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Kapasitas *
                    </span>
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Jumlah maksimal peserta"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="floor" className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Lantai *
                    </span>
                  </label>
                  <input
                    type="text"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: 2nd Floor"
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Gedung *
                    </span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: Tower C, Building A"
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
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
                <label htmlFor="image_upload" className="block text-sm font-semibold text-gray-700 mb-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Gambar Ruangan
                  </span>
                </label>
                
                <input
                  type="file"
                  id="image_upload"
                  name="image_upload"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={loading || uploadingImage}
                />
                
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Mengupload gambar...
                  </div>
                )}
                
                {selectedFile && !uploadingImage && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
                    <span className="text-green-500">✓</span>
                    Gambar berhasil diupload: {selectedFile.name}
                  </div>
                )}
                
                {formData.image_url && (
                  <div className="mt-4 relative">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-xl border-2 border-blue-200 shadow-md"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      ✓ Preview
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3">
                  Format yang didukung: JPG, PNG, GIF, WebP. Maksimal 5MB.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  🚫 Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {loading ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomPage;

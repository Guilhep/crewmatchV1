import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  imageFile?: File;
  aspect?: number; // Para avatar (1) ou capa (16/9 ou similar)
  cropShape?: 'rect' | 'round';
  title?: string;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onSave,
  imageFile,
  aspect = 1,
  cropShape = 'round',
  title = 'Ajustar Imagem',
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Carregar imagem quando o arquivo mudar
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // Reset quando modal abre
  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    }
  }, [isOpen]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Importante para CORS
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Tamanho do canvas baseado no tipo de imagem
    const outputSize = cropShape === 'round' ? 400 : 1200; // Avatar: 400px, Capa: 1200px width
    const outputHeight = cropShape === 'round' ? 400 : Math.round(outputSize / aspect);

    canvas.width = outputSize;
    canvas.height = outputHeight;

    // Limpar canvas antes de desenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar a imagem cropada
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            const result = reader.result as string;
            console.log('Imagem cropada gerada:', result.substring(0, 100) + '...');
            resolve(result);
          });
          reader.addEventListener('error', (error) => reject(error));
          reader.readAsDataURL(blob);
        },
        'image/jpeg', // Mudar para JPEG para melhor compatibilidade
        0.92 // Qualidade 92%
      );
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImage);
      onClose();
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-graphite rounded-2xl border border-white/10 p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white font-serif">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-offWhite/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Crop */}
          <div className="relative mb-6 bg-navy rounded-xl overflow-hidden border border-white/5" style={{ height: cropShape === 'round' ? '400px' : '300px' }}>
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={cropShape}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  },
                }}
              />
            )}
          </div>

          {/* Controles de Zoom */}
          <div className="mb-4">
            <label className="block text-sm text-offWhite/70 mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-graphite rounded-lg appearance-none cursor-pointer accent-gold"
            />
          </div>

          {/* Instruções */}
          <p className="text-xs text-offWhite/50 text-center mb-6">
            Arraste para posicionar • Ajuste o zoom para enquadrar
          </p>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-graphite border border-white/10 text-white rounded-xl hover:bg-graphite/80 hover:border-white/20 transition-all duration-300 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!croppedAreaPixels}
              className="flex-1 px-6 py-3 bg-gold text-navy rounded-xl hover:bg-goldHover transition-all duration-300 font-semibold shadow-lg shadow-gold/20 hover:shadow-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Foto
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageCropModal;

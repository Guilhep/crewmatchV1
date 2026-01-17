import React, { useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  imageFile?: File;
}

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  imageFile,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Limitar movimento dentro do container
      const maxX = rect.width / 2;
      const maxY = rect.height / 2;
      
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400; // Tamanho final do avatar (alta qualidade)
    canvas.width = size;
    canvas.height = size;

    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Tamanho do círculo de crop (300px)
    const cropCircleSize = 300;
    
    // Calcular escala da imagem no container
    const imgRect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Calcular centro do círculo de crop em relação à imagem
    const centerX = (containerRect.width / 2 - position.x) * scaleX / zoom;
    const centerY = (containerRect.height / 2 - position.y) * scaleY / zoom;
    
    // Tamanho do crop na imagem original
    const cropSize = (cropCircleSize / zoom) * scaleX;
    
    // Posição do crop
    const cropX = centerX - cropSize / 2;
    const cropY = centerY - cropSize / 2;

    // Limpar canvas
    ctx.clearRect(0, 0, size, size);

    // Criar clip circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Aplicar rotação
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);
    
    // Desenhar imagem cortada
    ctx.drawImage(
      img,
      cropX, cropY, cropSize, cropSize,
      0, 0, size, size
    );
    
    ctx.restore();

    // Converter para JPEG com qualidade alta
    const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
    onSave(croppedImage);
    onClose();
  }, [zoom, rotation, position, onSave, onClose]);

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
          className="relative w-full max-w-md bg-graphite rounded-2xl border border-white/10 p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white font-serif">Ajustar Foto de Perfil</h3>
            <button
              onClick={onClose}
              className="p-2 text-offWhite/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Crop */}
          <div className="relative mb-6 bg-navy rounded-xl overflow-hidden border border-white/5">
            <div
              ref={containerRef}
              className="relative w-full aspect-square overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {imageSrc && (
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Preview"
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                />
              )}
              {/* Overlay circular para indicar área de crop */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[300px] h-[300px] rounded-full border-2 border-gold border-dashed shadow-lg shadow-gold/20" />
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={handleZoomOut}
              className="p-2.5 bg-graphite border border-white/10 text-offWhite/80 rounded-lg hover:bg-graphite/80 hover:border-gold/30 hover:text-gold transition-all duration-300"
              aria-label="Diminuir zoom"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={handleRotate}
              className="p-2.5 bg-graphite border border-white/10 text-offWhite/80 rounded-lg hover:bg-graphite/80 hover:border-gold/30 hover:text-gold transition-all duration-300"
              aria-label="Rotacionar"
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2.5 bg-graphite border border-white/10 text-offWhite/80 rounded-lg hover:bg-graphite/80 hover:border-gold/30 hover:text-gold transition-all duration-300"
              aria-label="Aumentar zoom"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Instruções */}
          <p className="text-xs text-offWhite/50 text-center mb-6">
            Arraste para posicionar • Use os controles para ajustar zoom e rotação
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
              onClick={handleCrop}
              className="flex-1 px-6 py-3 bg-gold text-navy rounded-xl hover:bg-goldHover transition-all duration-300 font-semibold shadow-lg shadow-gold/20 hover:shadow-gold/30"
            >
              Salvar Foto
            </button>
          </div>

          {/* Canvas oculto para crop */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarUploadModal;




import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText } from "lucide-react";

interface FileUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  fileName: string | null;
}

const FileUpload = ({ onFileLoaded, fileName }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileLoaded(e.target?.result as string, file.name);
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-8"
    >
      <h2 className="font-display text-2xl font-bold mb-6 neon-glow-cyan">
        Upload Transactions
      </h2>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-neon-cyan/30 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-neon-cyan/60 hover:bg-neon-cyan/5"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-neon-green" />
            <p className="text-neon-green font-semibold text-lg">{fileName}</p>
            <p className="text-muted-foreground text-sm">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-neon-cyan/60" />
            <p className="text-foreground font-semibold text-lg">
              Drag & drop your transactions.csv
            </p>
            <p className="text-muted-foreground text-sm">or click to browse</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FileUpload;

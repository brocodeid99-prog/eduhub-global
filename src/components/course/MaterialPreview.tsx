import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  FileText,
  Video,
  File,
  Download,
  ExternalLink,
  X,
  Maximize2,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  material_type: string;
  content: string | null;
  file_url: string | null;
}

interface MaterialPreviewProps {
  material: Material | null;
  open: boolean;
  onClose: () => void;
}

export const MaterialPreview = ({ material, open, onClose }: MaterialPreviewProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!material) return null;

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5 text-primary" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-destructive" />;
      case "document":
        return <File className="w-5 h-5 text-warning" />;
      default:
        return <BookOpen className="w-5 h-5 text-success" />;
    }
  };

  const renderContent = () => {
    switch (material.material_type) {
      case "text":
        return (
          <ScrollArea className="h-[60vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
              <div className="whitespace-pre-wrap text-foreground">
                {material.content || "Tidak ada konten"}
              </div>
            </div>
          </ScrollArea>
        );

      case "video":
        if (!material.file_url) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Video className="w-12 h-12 mb-2" />
              <p>Video tidak tersedia</p>
            </div>
          );
        }
        return (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              src={material.file_url}
              controls
              className="w-full max-h-[70vh]"
              controlsList="nodownload"
            >
              Browser Anda tidak mendukung pemutar video.
            </video>
          </div>
        );

      case "pdf":
        if (!material.file_url) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-12 h-12 mb-2" />
              <p>PDF tidak tersedia</p>
            </div>
          );
        }
        return (
          <div className="relative">
            <iframe
              src={`${material.file_url}#toolbar=0`}
              className="w-full h-[70vh] rounded-lg border border-border"
              title={material.title}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
              >
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Fullscreen
                </a>
              </Button>
            </div>
          </div>
        );

      case "document":
        if (!material.file_url) {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <File className="w-12 h-12 mb-2" />
              <p>Dokumen tidak tersedia</p>
            </div>
          );
        }
        // Documents (Word, PPT) can't be previewed directly, show download option
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted/50 rounded-lg">
            <File className="w-16 h-16 text-warning mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {material.title}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Dokumen ini perlu didownload untuk dibuka
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka di Tab Baru
                </a>
              </Button>
              <Button variant="hero" asChild>
                <a href={material.file_url} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <BookOpen className="w-12 h-12 mb-2" />
            <p>Preview tidak tersedia untuk tipe materi ini</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getMaterialIcon(material.material_type)}
            <span>{material.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>

        {material.file_url && material.material_type !== "document" && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" asChild>
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buka di Tab Baru
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a href={material.file_url} download>
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

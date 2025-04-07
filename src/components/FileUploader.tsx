
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, XCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesLoaded: (files: { name: string; content: string }[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesLoaded }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      setSelectedFiles(Array.from(fileList));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const processFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo para processar');
      return;
    }

    setIsLoading(true);
    try {
      const processedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          return new Promise<{ name: string; content: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: file.name,
                content: e.target?.result as string
              });
            };
            reader.readAsText(file);
          });
        })
      );

      onFilesLoaded(processedFiles);
      toast.success('Arquivos processados com sucesso!');
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Erro ao processar arquivos');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFiles, onFilesLoaded]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importe seus arquivos de zona DNS</CardTitle>
        <CardDescription>
          Carregue arquivos de zona DNS do formato BIND para conversão em Terraform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".zone,.txt,.bind,.db"
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Arraste e solte arquivos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos suportados: .zone, .txt, .bind, .db
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Arquivos selecionados:</h3>
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-sm truncate max-w-[80%]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={processFiles} 
          disabled={selectedFiles.length === 0 || isLoading}
          className="w-full"
        >
          {isLoading ? 'Processando...' : 'Processar Arquivos'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUploader;

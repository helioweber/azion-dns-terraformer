
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Download, FileCode, Terminal } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface TerraformOutputProps {
  terraformCode: string;
}

const TerraformOutput: React.FC<TerraformOutputProps> = ({ terraformCode }) => {
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terraformCode);
    setCopied(true);
    addLog("Copiado para a área de transferência");
    addLog(`Total de ${terraformCode.length} caracteres copiados`);
    toast.success('Código copiado para a área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTerraformFile = () => {
    addLog("Iniciando download do arquivo Terraform");
    const blob = new Blob([terraformCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azion_dns.tf';
    document.body.appendChild(a);
    addLog("URL do objeto blob criada: " + url.substring(0, 30) + "...");
    addLog("Elemento <a> criado para download");
    a.click();
    addLog("Download iniciado pelo navegador");
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("Elemento <a> removido e URL do objeto blob liberada");
    addLog("Arquivo Terraform baixado com sucesso");
    toast.success('Arquivo Terraform baixado');
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TERRAFORM] ${message}`);
  };

  const toggleLogs = () => {
    setShowLogs(!showLogs);
    addLog(showLogs ? "Logs ocultados" : "Logs exibidos");
  };

  // Adicionar logs iniciais quando o componente recebe terraform code
  React.useEffect(() => {
    if (terraformCode) {
      addLog("Código Terraform carregado");
      addLog(`Tamanho do código: ${terraformCode.length} caracteres`);
      
      // Contador de recursos
      const zoneCount = (terraformCode.match(/resource "azion_intelligent_dns_zone"/g) || []).length;
      const recordCount = (terraformCode.match(/resource "azion_intelligent_dns_record"/g) || []).length;
      
      addLog(`Zonas detectadas: ${zoneCount}`);
      addLog(`Registros detectados: ${recordCount}`);
    }
  }, [terraformCode]);

  if (!terraformCode) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Código Terraform Gerado
        </CardTitle>
        <CardDescription>
          O código Terraform gerado para seus recursos DNS da Azion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
            <code>{terraformCode}</code>
          </pre>
        </div>
        
        {showLogs && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Logs de operação:</h3>
            <Textarea 
              readOnly 
              value={logs.join('\n')} 
              className="h-40 font-mono text-xs bg-black text-green-400"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={copyToClipboard}
        >
          <Copy className="mr-2 h-4 w-4" />
          {copied ? 'Copiado!' : 'Copiar código'}
        </Button>
        <Button
          variant="default"
          className="flex-1"
          onClick={downloadTerraformFile}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar arquivo .tf
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={toggleLogs}
        >
          <Terminal className="mr-2 h-4 w-4" />
          {showLogs ? 'Ocultar logs' : 'Mostrar logs'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TerraformOutput;

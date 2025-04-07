
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GitHubConfig } from '@/types';
import { Github, Terminal } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface GitHubFormProps {
  terraformCode: string;
  onSubmit: (config: GitHubConfig) => void;
}

const GitHubForm: React.FC<GitHubFormProps> = ({ terraformCode, onSubmit }) => {
  const [githubToken, setGithubToken] = useState('');
  const [repository, setRepository] = useState('');
  const [azionToken, setAzionToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[GITHUB] ${message}`);
  };

  const toggleLogs = () => {
    setShowLogs(!showLogs);
    addLog(showLogs ? "Logs ocultados" : "Logs exibidos");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!terraformCode) {
      const errorMsg = 'Nenhum código Terraform para enviar. Processe os arquivos primeiro.';
      addLog(`ERRO: ${errorMsg}`);
      toast.error(errorMsg);
      return;
    }
    
    if (!githubToken || !repository || !azionToken) {
      const errorMsg = 'Todos os campos são obrigatórios';
      addLog(`ERRO: ${errorMsg}`);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    addLog(`Iniciando envio para repositório: ${repository}`);
    addLog(`Tamanho do código Terraform: ${terraformCode.length} caracteres`);
    addLog(`Token GitHub: ${githubToken.substring(0, 4)}...${githubToken.substring(githubToken.length - 4)}`);
    addLog(`Token Azion: ${azionToken.substring(0, 4)}...${azionToken.substring(azionToken.length - 4)}`);
    
    // In a real app, we would make an API call here to push to GitHub
    // For this prototype, we'll simulate a successful push with detailed logs
    addLog("Simulando requisição para a API do GitHub...");
    
    setTimeout(() => {
      addLog("Preparando arquivo terraform para commit");
      
      setTimeout(() => {
        addLog("Criando branch no repositório remoto");
        
        setTimeout(() => {
          addLog("Realizando commit do arquivo terraform");
          
          setTimeout(() => {
            addLog("Configurando GitHub Action para sincronização com Azion");
            
            setTimeout(() => {
              addLog("Commit realizado com sucesso");
              onSubmit({
                token: githubToken,
                repository,
                azionToken
              });
              
              addLog(`Código enviado com sucesso para ${repository}`);
              toast.success(`Código enviado com sucesso para ${repository}`);
              setIsSubmitting(false);
            }, 500);
          }, 700);
        }, 600);
      }, 800);
    }, 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Enviar para GitHub
        </CardTitle>
        <CardDescription>
          Configure as credenciais para enviar o código Terraform para seu repositório GitHub
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-token">Token do GitHub</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => {
                setGithubToken(e.target.value);
                addLog("Token do GitHub atualizado");
              }}
              required
            />
            <p className="text-xs text-gray-500">
              Token pessoal com permissão para commits no repositório
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="repository">Repositório (formato: usuário/repo)</Label>
            <Input
              id="repository"
              type="text"
              placeholder="seu-usuario/seu-repositorio"
              value={repository}
              onChange={(e) => {
                setRepository(e.target.value);
                addLog(`Repositório atualizado para: ${e.target.value}`);
              }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="azion-token">Token da API da Azion</Label>
            <Input
              id="azion-token"
              type="password"
              placeholder="Seu token da API da Azion"
              value={azionToken}
              onChange={(e) => {
                setAzionToken(e.target.value);
                addLog("Token da Azion atualizado");
              }}
              required
            />
            <p className="text-xs text-gray-500">
              Este token será usado pela GitHub Action para sincronizar com a Azion
            </p>
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
        </form>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button 
          onClick={handleSubmit} 
          disabled={!terraformCode || isSubmitting || !githubToken || !repository || !azionToken}
          className="flex-1"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar para GitHub'}
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

export default GitHubForm;

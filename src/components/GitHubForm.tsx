
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GitHubConfig } from '@/types';
import { Github } from 'lucide-react';

interface GitHubFormProps {
  terraformCode: string;
  onSubmit: (config: GitHubConfig) => void;
}

const GitHubForm: React.FC<GitHubFormProps> = ({ terraformCode, onSubmit }) => {
  const [githubToken, setGithubToken] = useState('');
  const [repository, setRepository] = useState('');
  const [azionToken, setAzionToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!terraformCode) {
      toast.error('Nenhum código Terraform para enviar. Processe os arquivos primeiro.');
      return;
    }
    
    if (!githubToken || !repository || !azionToken) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    
    // In a real app, we would make an API call here to push to GitHub
    // For this prototype, we'll simulate a successful push
    setTimeout(() => {
      onSubmit({
        token: githubToken,
        repository,
        azionToken
      });
      
      toast.success(`Código enviado com sucesso para ${repository}`);
      setIsSubmitting(false);
    }, 1500);
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
              onChange={(e) => setGithubToken(e.target.value)}
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
              onChange={(e) => setRepository(e.target.value)}
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
              onChange={(e) => setAzionToken(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Este token será usado pela GitHub Action para sincronizar com a Azion
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={!terraformCode || isSubmitting || !githubToken || !repository || !azionToken}
          className="w-full"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar para GitHub'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GitHubForm;

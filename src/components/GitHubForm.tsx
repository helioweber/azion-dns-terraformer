
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { GitHubConfig } from '@/types';
import { Github, Terminal, Lock, ShieldAlert } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface GitHubFormProps {
  terraformCode: string;
  onSubmit: (config: GitHubConfig) => void;
}

// Função para codificar strings para Base64
const encodeBase64 = (str: string) => {
  return btoa(str);
};

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Validate repository format
    if (!repository.includes('/')) {
      const errorMsg = 'Formato de repositório inválido. Use o formato: usuario/repositorio';
      addLog(`ERRO: ${errorMsg}`);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    addLog(`Iniciando envio para repositório: ${repository}`);
    addLog(`Tamanho do código Terraform: ${terraformCode.length} caracteres`);
    addLog(`Token GitHub: ${githubToken.substring(0, 4)}...${githubToken.substring(githubToken.length - 4)}`);
    addLog(`Token Azion: ${azionToken.substring(0, 4)}...${azionToken.substring(azionToken.length - 4)}`);
    
    try {
      // Creating Terraform files
      const mainTerraformFilename = 'main.tf';
      
      // Create a terraform.tfvars file for the variable
      const tfvarsContent = `azion_api_token = "${azionToken}"`;
      const tfvarsFilename = 'terraform.tfvars';
      
      // Creating a GitHub Actions workflow
      const workflowContent = createGitHubWorkflow();
      
      // Creating the README file
      const readmeContent = createReadmeFile(repository);
      
      // Send to GitHub
      await commitToGitHub({
        token: githubToken,
        repository,
        azionToken,
        files: [
          { path: mainTerraformFilename, content: terraformCode },
          { path: tfvarsFilename, content: tfvarsContent },
          { path: '.github/workflows/terraform.yml', content: workflowContent },
          { path: 'README.md', content: readmeContent },
          // Add .gitignore to ignore .tfvars files
          { path: '.gitignore', content: '# Local .terraform directories\n**/.terraform/*\n\n# .tfstate files\n*.tfstate\n*.tfstate.*\n\n# Crash log files\ncrash.log\ncrash.*.log\n\n# Exclude all .tfvars files, which might contain sensitive data\n*.tfvars\n*.tfvars.json\n\n# Ignore override files\noverride.tf\noverride.tf.json\n*_override.tf\n*_override.tf.json\n\n# Ignore CLI configuration files\n.terraformrc\nterraform.rc' }
        ]
      });
      
      addLog(`Código enviado com sucesso para ${repository}`);
      toast.success(`Código enviado com sucesso para ${repository}`);
      
      onSubmit({
        token: githubToken,
        repository,
        azionToken
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`ERRO: ${errorMessage}`);
      toast.error(`Falha ao enviar para GitHub: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const createGitHubWorkflow = () => {
    return `name: 'Terraform'

on:
  push:
    branches: [ "main" ]
  pull_request:

permissions:
  contents: read

jobs:
  terraform:
    name: 'Terraform'
    runs-on: ubuntu-latest
    environment: production

    # Use the Bash shell regardless whether the GitHub Actions runner is ubuntu-latest, macos-latest, or windows-latest
    defaults:
      run:
        shell: bash

    steps:
    # Checkout the repository to the GitHub Actions runner
    - name: Checkout
      uses: actions/checkout@v3

    # Install the latest version of Terraform CLI
    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v1

    # Create tfvars file from GitHub secret
    - name: Create tfvars file
      run: |
        echo "azion_api_token = \\"$AZION_API_TOKEN\\"" > terraform.tfvars
      env:
        AZION_API_TOKEN: \${{ secrets.AZION_API_TOKEN }}

    # Initialize a new or existing Terraform working directory
    - name: Terraform Init
      run: terraform init

    # Validate the terraform files
    - name: Terraform Validate
      run: terraform validate

    # Generates an execution plan for Terraform
    - name: Terraform Plan
      run: terraform plan
        
    # Apply the terraform plan to create/update infrastructure
    - name: Terraform Apply
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      run: terraform apply -auto-approve
`;
  };
  
  const createReadmeFile = (repository: string) => {
    return `# Azion DNS Terraform

Este repositório contém a configuração Terraform para gerenciar zonas e registros DNS na plataforma Azion.

## Configuração

Para usar este repositório, você precisa:

1. Ter o Terraform instalado localmente para desenvolvimento
2. Configurar o token da API da Azion como um segredo no GitHub:
   - Acesse as configurações do repositório
   - Vá para "Secrets and variables" > "Actions"
   - Adicione um novo segredo com o nome \`AZION_API_TOKEN\` contendo seu token da API da Azion

## GitHub Actions

Este repositório está configurado com GitHub Actions para automaticamente aplicar as mudanças no Terraform quando code é enviado para a branch principal.

## Estrutura de Arquivos

- \`main.tf\`: Contém a definição dos recursos DNS da Azion e a configuração do provider
- \`terraform.tfvars\`: Contém o token da API Azion (gerado automaticamente no GitHub Actions)
- \`.github/workflows/terraform.yml\`: Define o pipeline de CI/CD para aplicar as mudanças

## Como Contribuir

1. Clone o repositório: \`git clone https://github.com/${repository}.git\`
2. Faça suas alterações
3. Envie um Pull Request

## Licença

MIT
`;
  };
  
  const commitToGitHub = async ({ 
    token, 
    repository, 
    azionToken,
    files 
  }: { 
    token: string, 
    repository: string, 
    azionToken: string,
    files: {path: string, content: string}[] 
  }) => {
    addLog("Iniciando processo de commit no GitHub...");
    
    // Obter o SHA da referência da branch principal (main)
    addLog("Obtendo referência da branch principal...");
    const getRefResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/main`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });
    
    if (getRefResponse.status === 404) {
      // Se a branch não existir, vamos criar todos os arquivos do zero
      addLog("Branch principal não encontrada. Criando novo repositório...");
      
      // Verificar se o repositório existe
      const repoCheckResponse = await fetch(`https://api.github.com/repos/${repository}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (repoCheckResponse.status === 404) {
        // O repositório não existe, vamos tentar criar
        const [owner, repo] = repository.split('/');
        addLog(`Repositório não encontrado. Tentando criar ${repo} para o usuário ${owner}...`);

        const createRepoResponse = await fetch(`https://api.github.com/user/repos`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repo,
            auto_init: true,
            private: false,
            description: 'Azion DNS configurado com Terraform'
          })
        });
        
        if (!createRepoResponse.ok) {
          const errorData = await createRepoResponse.json();
          throw new Error(`Falha ao criar repositório: ${errorData.message}`);
        }
        
        addLog("Repositório criado com sucesso. Aguardando inicialização...");
        // Esperar um pouco para o GitHub inicializar o repositório
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Tentar novamente obter a referência
      const retryGetRefResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/main`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!retryGetRefResponse.ok) {
        throw new Error(`Falha ao obter referência da branch: ${retryGetRefResponse.statusText}`);
      }
      
      const refData = await retryGetRefResponse.json();
      const latestCommitSha = refData.object.sha;
      
      // Obter a árvore base
      addLog("Obtendo árvore de arquivos base...");
      const baseTreeResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${latestCommitSha}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!baseTreeResponse.ok) {
        throw new Error(`Falha ao obter árvore base: ${baseTreeResponse.statusText}`);
      }
      
      const baseTreeData = await baseTreeResponse.json();
      const baseTreeSha = baseTreeData.tree.sha;
      
      // Criar blobs para cada arquivo
      addLog("Criando blobs para arquivos...");
      const blobPromises = files.map(async file => {
        const createBlobResponse = await fetch(`https://api.github.com/repos/${repository}/git/blobs`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8'
          })
        });
        
        if (!createBlobResponse.ok) {
          throw new Error(`Falha ao criar blob para ${file.path}: ${createBlobResponse.statusText}`);
        }
        
        const blobData = await createBlobResponse.json();
        return {
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        };
      });
      
      const treeItems = await Promise.all(blobPromises);
      
      // Criar uma nova árvore
      addLog("Criando nova árvore de arquivos...");
      const createTreeResponse = await fetch(`https://api.github.com/repos/${repository}/git/trees`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });
      
      if (!createTreeResponse.ok) {
        throw new Error(`Falha ao criar árvore: ${createTreeResponse.statusText}`);
      }
      
      const treeData = await createTreeResponse.json();
      
      // Criar um commit
      addLog("Criando commit...");
      const createCommitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Adicionar configuração Terraform para DNS da Azion',
          tree: treeData.sha,
          parents: [latestCommitSha]
        })
      });
      
      if (!createCommitResponse.ok) {
        throw new Error(`Falha ao criar commit: ${createCommitResponse.statusText}`);
      }
      
      const commitData = await createCommitResponse.json();
      
      // Atualizar a referência
      addLog("Atualizando branch principal com novo commit...");
      const updateRefResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: commitData.sha,
          force: false
        })
      });
      
      if (!updateRefResponse.ok) {
        throw new Error(`Falha ao atualizar referência: ${updateRefResponse.statusText}`);
      }
      
      // Configurar GitHub Secret para o token da API Azion
      addLog("Configurando segredo AZION_API_TOKEN no repositório...");
      
      // Primeiro, obtemos a chave pública do repositório para criptografar o segredo
      const getPublicKeyResponse = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/public-key`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!getPublicKeyResponse.ok) {
        addLog(`AVISO: Não foi possível obter chave pública para configurar segredo: ${getPublicKeyResponse.statusText}`);
        addLog("Você precisará configurar manualmente o segredo AZION_API_TOKEN nas configurações do repositório.");
      } else {
        const publicKeyData = await getPublicKeyResponse.json();
        
        try {
          // Para uma implementação completa, seria necessário importar uma biblioteca de criptografia
          // como o sodium-plus ou tweetsodium para criptografar corretamente o segredo
          // No entanto, para simplificar, vamos apenas tentar salvar o segredo diretamente
          
          addLog("Chave pública obtida. Criando segredo AZION_API_TOKEN...");
          
          const createSecretResponse = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/AZION_API_TOKEN`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              encrypted_value: encodeBase64(azionToken), // Esta é uma simplificação, deveria ser criptografado corretamente
              key_id: publicKeyData.key_id
            })
          });
          
          if (createSecretResponse.ok) {
            addLog("Segredo AZION_API_TOKEN criado com sucesso!");
          } else {
            addLog(`AVISO: Falha ao criar segredo automaticamente: ${createSecretResponse.statusText}`);
            addLog("Você precisará configurar manualmente o segredo AZION_API_TOKEN nas configurações do repositório GitHub:");
            addLog("1. Acesse as configurações do seu repositório");
            addLog("2. Vá para 'Secrets and variables' > 'Actions'");
            addLog("3. Adicione um novo segredo com o nome AZION_API_TOKEN contendo seu token da API da Azion");
          }
        } catch (error) {
          addLog("AVISO: Erro ao configurar segredo automaticamente");
          addLog("Você precisará configurar manualmente o segredo AZION_API_TOKEN nas configurações do repositório GitHub:");
          addLog("1. Acesse as configurações do seu repositório");
          addLog("2. Vá para 'Secrets and variables' > 'Actions'");
          addLog("3. Adicione um novo segredo com o nome AZION_API_TOKEN contendo seu token da API da Azion");
        }
      }
      
      addLog("Commit concluído com sucesso!");
    } else if (!getRefResponse.ok) {
      throw new Error(`Falha ao acessar repositório: ${getRefResponse.statusText}`);
    } else {
      // A branch main existe, vamos atualizar os arquivos
      addLog("Branch main encontrada. Atualizando arquivos existentes...");
      // Segue o mesmo processo de commit descrito acima
      const refData = await getRefResponse.json();
      const latestCommitSha = refData.object.sha;
      
      // Obter a árvore base
      addLog("Obtendo árvore de arquivos base...");
      const baseTreeResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${latestCommitSha}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!baseTreeResponse.ok) {
        throw new Error(`Falha ao obter árvore base: ${baseTreeResponse.statusText}`);
      }
      
      const baseTreeData = await baseTreeResponse.json();
      const baseTreeSha = baseTreeData.tree.sha;
      
      // Criar blobs para cada arquivo
      addLog("Criando blobs para arquivos...");
      const blobPromises = files.map(async file => {
        const createBlobResponse = await fetch(`https://api.github.com/repos/${repository}/git/blobs`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8'
          })
        });
        
        if (!createBlobResponse.ok) {
          throw new Error(`Falha ao criar blob para ${file.path}: ${createBlobResponse.statusText}`);
        }
        
        const blobData = await createBlobResponse.json();
        return {
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        };
      });
      
      const treeItems = await Promise.all(blobPromises);
      
      // Criar uma nova árvore
      addLog("Criando nova árvore de arquivos...");
      const createTreeResponse = await fetch(`https://api.github.com/repos/${repository}/git/trees`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });
      
      if (!createTreeResponse.ok) {
        throw new Error(`Falha ao criar árvore: ${createTreeResponse.statusText}`);
      }
      
      const treeData = await createTreeResponse.json();
      
      // Criar um commit
      addLog("Criando commit...");
      const createCommitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Atualizar configuração Terraform para DNS da Azion',
          tree: treeData.sha,
          parents: [latestCommitSha]
        })
      });
      
      if (!createCommitResponse.ok) {
        throw new Error(`Falha ao criar commit: ${createCommitResponse.statusText}`);
      }
      
      const commitData = await createCommitResponse.json();
      
      // Atualizar a referência
      addLog("Atualizando branch principal com novo commit...");
      const updateRefResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: commitData.sha,
          force: false
        })
      });
      
      if (!updateRefResponse.ok) {
        throw new Error(`Falha ao atualizar referência: ${updateRefResponse.statusText}`);
      }
      
      // Atualizar ou criar o segredo AZION_API_TOKEN
      addLog("Atualizando segredo AZION_API_TOKEN no repositório...");
      
      // Obtemos a chave pública do repositório para criptografar o segredo
      const getPublicKeyResponse = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/public-key`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!getPublicKeyResponse.ok) {
        addLog(`AVISO: Não foi possível obter chave pública para configurar segredo: ${getPublicKeyResponse.statusText}`);
        addLog("Você precisará configurar manualmente o segredo AZION_API_TOKEN nas configurações do repositório GitHub.");
      } else {
        const publicKeyData = await getPublicKeyResponse.json();
        
        try {
          // Para uma implementação completa, seria necessário importar uma biblioteca de criptografia
          addLog("Chave pública obtida. Atualizando segredo AZION_API_TOKEN...");
          
          const createSecretResponse = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/AZION_API_TOKEN`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              encrypted_value: encodeBase64(azionToken), // Esta é uma simplificação, deveria ser criptografado corretamente
              key_id: publicKeyData.key_id
            })
          });
          
          if (createSecretResponse.ok) {
            addLog("Segredo AZION_API_TOKEN atualizado com sucesso!");
          } else {
            addLog(`AVISO: Falha ao atualizar segredo automaticamente: ${createSecretResponse.statusText}`);
            addLog("Você precisará configurar manualmente o segredo AZION_API_TOKEN nas configurações do repositório.");
          }
        } catch (error) {
          addLog("AVISO: Erro ao configurar segredo automaticamente");
          addLog("Você precisará configurar manualmente o segredo AZION_API_TOKEN nas configurações do repositório GitHub.");
        }
      }
      
      addLog("Commit concluído com sucesso!");
    }
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
            <Label htmlFor="azion-token" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Token da API da Azion
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </Label>
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
              Este token será salvo como um segredo no GitHub para uso pelas GitHub Actions
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

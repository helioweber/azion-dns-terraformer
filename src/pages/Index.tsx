
import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import TerraformOutput from '@/components/TerraformOutput';
import GitHubForm from '@/components/GitHubForm';
import AnalysisReport from '@/components/AnalysisReport';
import { parseBindFiles } from '@/utils/bindParser';
import { generateTerraformConfig } from '@/utils/terraformGenerator';
import { analyzeDnsRecords, generateAnalysisReport } from '@/utils/analysisEngine';
import { BindZone, AnalysisResult, GitHubConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { FileCode, FileSearch, Github } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Index = () => {
  const [parsedZones, setParsedZones] = useState<BindZone[]>([]);
  const [terraformCode, setTerraformCode] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [analysisReport, setAnalysisReport] = useState('');
  const [activeTab, setActiveTab] = useState('upload');

  const handleFilesLoaded = (files: { name: string; content: string }[]) => {
    try {
      // Parse the BIND files
      const zones = parseBindFiles(files);
      setParsedZones(zones);
      
      // Generate Terraform code without hardcoded token
      const terraform = generateTerraformConfig(zones);
      setTerraformCode(terraform);
      
      // Analyze DNS configurations
      const results = analyzeDnsRecords(zones);
      setAnalysisResults(results);
      
      // Generate analysis report
      const report = generateAnalysisReport(results);
      setAnalysisReport(report);
      
      // Move to the Terraform output tab
      setActiveTab('terraform');
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Erro ao processar os arquivos DNS');
    }
  };

  const handleGitHubSubmit = (config: GitHubConfig) => {
    // Log the GitHub configuration
    console.log('GitHub configuration:', config);
    
    // No need to regenerate the Terraform code as we now use GitHub secrets
    toast.success('Configuração salva e enviada para GitHub com sucesso!');
  };

  const runAnalysis = () => {
    if (parsedZones.length === 0) {
      toast.error('Nenhuma zona DNS para analisar. Por favor, carregue os arquivos primeiro.');
      return;
    }
    
    // Move to the analysis tab
    setActiveTab('analysis');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Azion DNS Terraformer</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={runAnalysis} disabled={parsedZones.length === 0}>
              <FileSearch className="mr-2 h-4 w-4" />
              Analisar DNS
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="upload">Carregar Arquivos</TabsTrigger>
              <TabsTrigger value="terraform" disabled={!terraformCode}>Código Terraform</TabsTrigger>
              <TabsTrigger value="analysis" disabled={analysisResults.length === 0}>Análise de Segurança</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-8">
              <div className="prose max-w-none mb-6">
                <h2 className="text-xl font-semibold mb-4">Converta arquivos BIND para Terraform da Azion</h2>
                <p className="text-gray-600">
                  Essa ferramenta converte seus arquivos de zona DNS do formato BIND para recursos Terraform da Azion,
                  permitindo que você gerencie sua infraestrutura de DNS como código.
                </p>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Como funciona</h3>
                <ol className="list-decimal list-inside text-blue-700 space-y-1">
                  <li>Carregue seus arquivos de zona DNS no formato BIND</li>
                  <li>A ferramenta converte automaticamente para recursos Terraform da Azion</li>
                  <li>Analise os resultados e faça ajustes se necessário</li>
                  <li>Envie o código para o GitHub para integração contínua</li>
                </ol>
              </div>
              
              <FileUploader onFilesLoaded={handleFilesLoaded} />
            </TabsContent>
            
            <TabsContent value="terraform" className="space-y-8">
              <TerraformOutput terraformCode={terraformCode} />
              <GitHubForm terraformCode={terraformCode} onSubmit={handleGitHubSubmit} />
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-8">
              <AnalysisReport results={analysisResults} reportText={analysisReport} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          Azion DNS Terraformer &copy; {new Date().getFullYear()} - Converta arquivos BIND para Terraform da Azion
        </div>
      </footer>
    </div>
  );
};

export default Index;

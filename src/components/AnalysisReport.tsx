
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisResult } from '@/types';
import { AlertTriangle, CheckCircle, Download, FileSearch, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisReportProps {
  results: AnalysisResult[];
  reportText: string;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ results, reportText }) => {
  const downloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dns_analysis_report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Relatório de análise baixado');
  };

  if (!results.length) {
    return null;
  }

  const highSeverityCount = results.filter(r => r.severity === 'high').length;
  const mediumSeverityCount = results.filter(r => r.severity === 'medium').length;
  const lowSeverityCount = results.filter(r => r.severity === 'low').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Análise de Boas Práticas DNS
        </CardTitle>
        <CardDescription>
          Recomendações para melhorar a performance e a segurança da sua configuração DNS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-medium">Críticas</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{highSeverityCount}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Médias</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600">{mediumSeverityCount}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Baixas</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{lowSeverityCount}</span>
          </div>
        </div>

        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-md">
              <CheckCircle className="h-5 w-5 mr-2" />
              Nenhum problema encontrado. Sua configuração DNS segue as melhores práticas!
            </div>
          ) : (
            results.slice(0, 3).map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-md ${
                  result.severity === 'high' 
                    ? 'bg-red-50 border-l-4 border-red-500' 
                    : result.severity === 'medium'
                    ? 'bg-yellow-50 border-l-4 border-yellow-500'
                    : 'bg-blue-50 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{result.issueType}</h3>
                  {result.severity === 'high' ? (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Crítico</span>
                  ) : result.severity === 'medium' ? (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Médio</span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Baixo</span>
                  )}
                </div>
                <p className="text-sm mb-2">{result.description}</p>
                <p className="text-sm font-medium">Recomendação: {result.recommendation}</p>
              </div>
            ))
          )}

          {results.length > 3 && (
            <p className="text-sm text-gray-600 text-center">
              + {results.length - 3} outros problemas encontrados. Baixe o relatório completo para ver todos.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={downloadReport}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar Relatório Completo
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AnalysisReport;

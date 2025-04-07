
import { BindZone, BindRecord, TerraformZone, TerraformRecord } from '@/types';

/**
 * Convert BindRecord to TerraformRecord
 */
function convertRecordToTerraform(record: BindRecord): TerraformRecord {
  return {
    record_type: record.type,
    entry: record.name,
    answers_list: record.data,
    policy: "simple", // Default policy
    ttl: record.ttl || 3600,
    description: `Auto-generated from BIND for ${record.name || '@'}`
  };
}

/**
 * Generate Terraform code for a zone
 */
export function generateZoneTerraform(zone: BindZone): string {
  const zoneName = zone.name || zone.domain.split('.')[0];
  const terraformZone: TerraformZone = {
    domain: zone.domain,
    is_active: zone.isActive || true,
    name: zoneName
  };
  
  const zoneCode = `resource "azion_intelligent_dns_zone" "${zoneName}" {
  zone = {
    domain     = "${terraformZone.domain}"
    is_active  = ${terraformZone.is_active.toString()}
    name       = "${terraformZone.name}"
  }
}

`;

  return zoneCode;
}

/**
 * Generate Terraform code for records
 */
export function generateRecordsTerraform(zone: BindZone): string {
  const zoneName = zone.name || zone.domain.split('.')[0];
  let recordsCode = '';
  
  zone.records.forEach((record, index) => {
    const terraformRecord = convertRecordToTerraform(record);
    const recordName = record.name ? record.name.replace(/\./g, '_') : 'root';
    const resourceName = `${zoneName}_${recordName}_${record.type.toLowerCase()}_${index}`;
    
    recordsCode += `resource "azion_intelligent_dns_record" "${resourceName}" {
  zone_id = "\${azion_intelligent_dns_zone.${zoneName}.id}"
  record = {
    record_type  = "${terraformRecord.record_type}"
    entry        = "${terraformRecord.entry}"
    answers_list = [
${terraformRecord.answers_list.map(answer => `      "${answer}"`).join(',\n')}
    ]
    policy       = "${terraformRecord.policy}"
    ttl          = ${terraformRecord.ttl}
    description  = "${terraformRecord.description}"
  }
}

`;
  });
  
  return recordsCode;
}

/**
 * Generate provider configuration
 */
export function generateProviderConfig(): string {
  // Usando uma referência à variável de ambiente nas GitHub Actions
  return `terraform {
  required_providers {
    azion = {
      source  = "aziontech/azion"
      version = "~> 1.0.0"
    }
  }
}

provider "azion" {
  # O token da API é obtido da variável de ambiente AZION_API_TOKEN
  # configurada nas GitHub Actions a partir do segredo do repositório
}

`;
}

/**
 * Generate complete Terraform configuration
 */
export function generateTerraformConfig(zones: BindZone[]): string {
  let config = generateProviderConfig();
  
  zones.forEach(zone => {
    config += generateZoneTerraform(zone);
    config += generateRecordsTerraform(zone);
  });
  
  return config;
}

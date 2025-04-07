
import { BindZone, BindRecord } from '@/types';

/**
 * Parse BIND zone file content into structured data
 */
export function parseBindFile(content: string): BindZone {
  // Extract domain from the zone file
  const domainMatch = content.match(/\$ORIGIN\s+([^\s]+)/);
  let domain = domainMatch ? domainMatch[1] : '';
  
  // Remove trailing dot if present
  if (domain.endsWith('.')) {
    domain = domain.slice(0, -1);
  }
  
  // Default domain name from filename if not found
  if (!domain) {
    domain = 'example.com';
  }
  
  const records: BindRecord[] = [];
  const lines = content.split('\n');
  
  let currentTTL: number | undefined;
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith(';') || line.trim() === '') {
      continue;
    }
    
    // Handle $TTL directive
    if (line.trim().startsWith('$TTL')) {
      const ttlMatch = line.match(/\$TTL\s+(\d+)/);
      if (ttlMatch) {
        currentTTL = parseInt(ttlMatch[1], 10);
      }
      continue;
    }
    
    // Skip SOA and NS records at the zone level
    if (line.includes('SOA') || (line.includes('NS') && !line.match(/^\S+\s+/))) {
      continue;
    }
    
    // Handle actual records
    const recordMatch = line.match(/^(\S+)?\s+(?:(\d+)\s+)?(?:IN\s+)?(\S+)\s+(.+)$/);
    if (recordMatch) {
      const [, name = '@', ttlStr, type, data] = recordMatch;
      
      let recordName = name === '@' ? '' : name;
      // Remove trailing dot if present
      if (recordName.endsWith('.')) {
        recordName = recordName.slice(0, -1);
      }
      
      const ttl = ttlStr ? parseInt(ttlStr, 10) : currentTTL;
      
      // Handle different record types and their data formats
      let cleanData = data.trim();
      if (cleanData.endsWith('.')) {
        cleanData = cleanData.slice(0, -1);
      }
      
      const dataArray = cleanData.split(/\s+/);
      
      records.push({
        type: type.toUpperCase(),
        name: recordName,
        ttl,
        class: 'IN',
        data: dataArray,
      });
    }
  }
  
  return {
    domain,
    name: domain.split('.')[0],
    records,
    isActive: true,
  };
}

/**
 * Parse multiple BIND zone files
 */
export function parseBindFiles(files: { name: string; content: string }[]): BindZone[] {
  return files.map(file => parseBindFile(file.content));
}

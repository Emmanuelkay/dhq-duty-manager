import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function CVEFeed({ mode = 'compact' }) {
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDominant = mode === 'dominant';

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchCVEs = async () => {
      try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const formatNVDDate = (date) => {
          return date.toISOString().split('.')[0] + '.000';
        };

        const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${formatNVDDate(sevenDaysAgo)}&pubEndDate=${formatNVDDate(today)}&cvssV3Severity=CRITICAL`;
        
        console.log('NVD API URL:', url);

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('NVD API unreachable');
        
        const data = await response.json();
        const vulnerabilities = data.vulnerabilities || [];
        
        const processed = vulnerabilities
          .map(v => {
            const { cve } = v;
            const desc = cve.descriptions.find(d => d.lang === 'en')?.value || 'No description available';
            
            const metricV31 = cve.metrics?.cvssMetricV31?.[0];
            const metricV30 = cve.metrics?.cvssMetricV30?.[0];
            const cvss = metricV31 || metricV30;
            
            return {
              id: cve.id,
              description: desc,
              score: cvss?.cvssData?.baseScore,
              severity: cvss?.cvssData?.baseSeverity || 'UNKNOWN',
              published: cve.published
            };
          })
          .sort((a, b) => new Date(b.published) - new Date(a.published));

        setCves(processed);
        setError(null);
      } catch (err) {
        setError('Unable to reach NVD — threat feed unavailable');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchCVEs();
    return () => controller.abort();
  }, []);

  const getSeverityColor = (sev) => {
    if (sev === 'CRITICAL') return '#ff453a';
    if (sev === 'HIGH') return '#ff9f0a';
    return 'rgba(255, 255, 255, 0.45)';
  };

  const displayCves = cves.slice(0, isDominant ? 7 : 5);
  const totalCount = cves.length;
  const criticalCount = displayCves.filter(c => c.severity === 'CRITICAL').length;
  const highCount = displayCves.filter(c => c.severity === 'HIGH').length;

  if (loading) {
    return (
      <div className={`cve-feed ${mode}`}>
        <div className="cve-feed__header">
          <span className="cve-header-title">
            Threat Intelligence  •  Last 7 days  •  Critical CVEs only
          </span>
        </div>
        {[...Array(isDominant ? 10 : 5)].map((_, i) => (
          <div key={i} className="cve-row">
            <div className="cve-skeleton" style={{ width: '80px', animationDelay: `${i * 0.15}s` }}></div>
            <div className="cve-skeleton" style={{ flex: 1, animationDelay: `${i * 0.15 + 0.05}s` }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || cves.length === 0) {
    return (
      <div className={`cve-feed ${mode}`}>
        <div className="cve-feed__header">
          <span className="cve-header-title">
            Threat Intelligence  •  Last 7 days  •  Critical CVEs only
          </span>
        </div>
        <div className="cve-error">
          <span>{error || 'No critical CVEs published in the last 7 days'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`cve-feed ${mode}`}>
      <div className="cve-feed__header">
        <span className="cve-header-title">
          Threat Intelligence  •  Last 7 days  •  Critical CVEs only
        </span>
        <div className="cve-count-badge">
          {displayCves.length} CVEs
        </div>
      </div>

      {isDominant && (
        <div className="cve-summary-bar">
          <span style={{ color: '#ff453a', fontWeight: '600', fontSize: '0.72rem' }}>■ {criticalCount} Critical</span>
          <span style={{ color: '#ff9f0a', fontWeight: '600', fontSize: '0.72rem', marginLeft: '16px' }}>■ {highCount} High</span>
        </div>
      )}

      {displayCves.map((cve) => {
        const nvdUrl = `https://nvd.nist.gov/vuln/detail/${cve.id}`;
        const severity = cve.severity;
        const score = cve.score;
        const cveId = cve.id;
        const description = cve.description;
        const formattedDate = isDominant 
          ? format(new Date(cve.published), 'd MMM • HH:mm') 
          : format(new Date(cve.published), 'MMM d');

        return (
          <div key={cve.id} className="cve-row" onClick={() => window.open(nvdUrl, '_blank')}>
            
            {/* Column 1: Severity badge + score */}
            <div className="cve-col-severity">
              <span className={`cve-badge cve-badge--${severity.toLowerCase()}`}>
                {severity}
              </span>
              <span className="cve-score">{score}</span>
            </div>

            {/* Column 2: CVE ID */}
            <div className="cve-col-id">
              <span className="cve-id">{cveId}</span>
            </div>

            {/* Column 3: Description — THIS is the problematic column */}
            <div className="cve-col-description">
              <span className="cve-description">{description}</span>
            </div>

            {/* Column 4: Date */}
            <div className="cve-col-date">
              <span className="cve-date">{formattedDate}</span>
            </div>

          </div>
        );
      })}

      {isDominant && (
        <div className="cve-view-all">
          <a 
            href="https://nvd.nist.gov/vuln/search/results?cvssV3Severity=CRITICAL" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View all {totalCount} critical CVEs on NVD →
          </a>
        </div>
      )}
    </div>
  );
}

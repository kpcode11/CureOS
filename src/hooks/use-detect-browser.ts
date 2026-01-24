import { useEffect, useState } from 'react';

export default function useDetectBrowser(): string {
  const [browserName, setBrowserName] = useState('Unknown');

  useEffect(() => {
    const agent = navigator.userAgent.toLowerCase();

    if (agent.indexOf('edg') > -1) {
      setBrowserName('Edge');
    } else if (agent.indexOf('opr') > -1 || agent.indexOf('opera') > -1) {
      setBrowserName('Opera');
    } else if (agent.indexOf('chrome') > -1) {
      setBrowserName('Chrome');
    } else if (agent.indexOf('trident') > -1) {
      setBrowserName('IE');
    } else if (agent.indexOf('firefox') > -1) {
      setBrowserName('Firefox');
    } else if (agent.indexOf('safari') > -1) {
      setBrowserName('Safari');
    }
  }, []);

  return browserName;
}

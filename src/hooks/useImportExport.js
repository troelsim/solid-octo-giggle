import { useState, useRef, useLayoutEffect } from 'react';
import { buildLayoutCsv, parseLayoutCsv } from '../utils/layoutCsv';

/**
 * Manages all state and logic for the CSV import and export flows.
 *
 * @param {object} opts
 * @param {Array}    opts.turbines       - current turbine list (read for export and import confirmation)
 * @param {object}   opts.fleet          - current fleet spec (read for export)
 * @param {Function} opts.setTurbines    - replaces the turbine list on import
 * @param {object}   opts.idCounter      - mutable ref holding the next turbine ID counter
 * @param {Function} opts.onImportSuccess - called after a successful import (e.g. reset mode/selection)
 */
export function useImportExport({ turbines, fleet, setTurbines, idCounter, onImportSuccess }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCsv, setExportCsv] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const exportRef = useRef(null);

  // Focus and select the export textarea whenever it becomes visible.
  useLayoutEffect(() => {
    if (!showExportModal || !exportRef.current) return;
    exportRef.current.focus();
    exportRef.current.select();
  }, [showExportModal, exportCsv]);

  const openExport = () => {
    setExportCsv(buildLayoutCsv(turbines, fleet));
    setShowExportModal(true);
  };

  const closeExport = () => setShowExportModal(false);

  const openImport = () => setShowImportModal(true);

  const closeImport = () => {
    setShowImportModal(false);
    setShowImportConfirm(false);
    setImportCsvText('');
    setImportError('');
  };

  const handleImportCsvChange = (text) => {
    setImportCsvText(text);
    setImportError('');
  };

  const handleImportSubmit = () => {
    try {
      parseLayoutCsv(importCsvText);
      setImportError('');
      setShowImportConfirm(true);
    } catch (e) {
      setImportError(e.message);
      setShowImportConfirm(false);
    }
  };

  const executeImport = () => {
    try {
      const rows = parseLayoutCsv(importCsvText);
      setTurbines(rows.map(row => ({ id: `t${idCounter.current++}`, ...row })));
      closeImport();
      onImportSuccess();
    } catch (e) {
      setImportError(e.message);
      setShowImportConfirm(false);
    }
  };

  return {
    // export
    showExportModal,
    exportCsv,
    exportRef,
    openExport,
    closeExport,
    // import
    showImportModal,
    importCsvText,
    showImportConfirm,
    setShowImportConfirm,
    importError,
    openImport,
    closeImport,
    handleImportCsvChange,
    handleImportSubmit,
    executeImport,
  };
}

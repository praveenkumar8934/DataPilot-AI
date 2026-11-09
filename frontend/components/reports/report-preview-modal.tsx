"use client";

import React, { useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  datasetName: string;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  htmlContent,
  datasetName,
}: ReportPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${datasetName.replace(/[^\w\-]/g, "_")}_executive_report.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Executive Audit Report Preview"
      description={`Printable PDF & HTML executive summary for "${datasetName}"`}
      maxWidth="4xl"
    >
      <div className="space-y-4 pt-1">
        {/* Action Bar */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Tip: Click <strong>Print / Save as PDF</strong> to generate a print-ready vector PDF report.
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadHTML}
              className="h-7 text-xs px-2.5"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download HTML
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handlePrint}
              className="h-7 text-xs px-3 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Embedded Iframe Container */}
        <div className="w-full h-[620px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white shadow-inner">
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title="Executive Report Preview"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </Modal>
  );
}

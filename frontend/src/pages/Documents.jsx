import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar/Navbar";
import Loader from "../components/Loader/Loader";
import api from "../services/api";

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [indexingPhase, setIndexingPhase] = useState(false);
  const [rowActionFileName, setRowActionFileName] = useState(null);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load documents.",
      });
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const resetUploadState = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setMessage(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      const fileName = uploadRes.data.fileName;
      setUploading(false);
      setIndexingPhase(true);

      await api.post("/documents/index", { fileName });

      setMessage({ type: "success", text: `"${fileName}" uploaded and indexed successfully.` });
      resetUploadState();
      fetchDocuments();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Upload or indexing failed.",
      });
    } finally {
      setUploading(false);
      setIndexingPhase(false);
    }
  };

  const handleReindex = async (fileName) => {
    setMessage(null);
    setRowActionFileName(fileName);
    try {
      await api.post("/documents/reindex", { fileName });
      setMessage({ type: "success", text: `"${fileName}" re-indexed successfully.` });
      fetchDocuments();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || `Failed to re-index "${fileName}".`,
      });
    } finally {
      setRowActionFileName(null);
    }
  };

  const handleDelete = async (fileName) => {
    setMessage(null);
    setRowActionFileName(fileName);
    try {
      await api.delete(`/documents/${encodeURIComponent(fileName)}`);
      setMessage({ type: "success", text: `"${fileName}" deleted successfully.` });
      fetchDocuments();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || `Failed to delete "${fileName}".`,
      });
    } finally {
      setRowActionFileName(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-sage-800 mb-6">Documents</h1>

        <form
          onSubmit={handleUpload}
          className="bg-white border border-sage-100 rounded-2xl p-6 shadow-soft mb-8"
        >
          <label className="block text-sm font-medium text-sage-700 mb-2">
            Upload a PDF (annual report, quarterly results, filing)
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1 text-sm text-sage-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-sage-100 file:text-sage-700 file:font-medium hover:file:bg-sage-200"
              disabled={uploading || indexingPhase}
            />
            <button
              type="submit"
              disabled={!file || uploading || indexingPhase}
              className="bg-sage-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-sage-700 transition disabled:opacity-40 shadow-soft whitespace-nowrap"
            >
              Upload
            </button>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-sage-500 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-sage-100 rounded-full h-2">
                <div
                  className="bg-sage-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {indexingPhase && (
            <div className="mt-4 flex items-center gap-2 text-sm text-sage-600">
              <Loader size={16} />
              Indexing document into the knowledge base...
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm rounded-lg px-3 py-2 border ${
                message.type === "success"
                  ? "text-sage-700 bg-sage-50 border-sage-100"
                  : "text-rose-600 bg-rose-50 border-rose-100"
              }`}
            >
              {message.text}
            </p>
          )}
        </form>

        <div className="bg-white border border-sage-100 rounded-2xl shadow-soft overflow-hidden">
          {loadingDocs ? (
            <div className="p-8 flex justify-center">
              <Loader />
            </div>
          ) : documents.length === 0 ? (
            <p className="p-8 text-center text-sage-400">No documents uploaded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-sage-500">
                  <th className="px-4 py-3 font-medium">File name</th>
                  <th className="px-4 py-3 font-medium">Upload date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const isRowBusy = rowActionFileName === doc.fileName;
                  return (
                    <tr key={doc.fileName} className="border-b border-sage-50 last:border-0">
                      <td className="px-4 py-3 text-sage-800 font-medium">{doc.fileName}</td>
                      <td className="px-4 py-3 text-sage-500">
                        {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            doc.indexed
                              ? "bg-sage-100 text-sage-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {doc.indexed ? "Indexed" : "Not Indexed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleReindex(doc.fileName)}
                          disabled={isRowBusy}
                          className="text-xs font-medium text-sage-600 hover:underline disabled:opacity-40"
                        >
                          {isRowBusy ? "Working..." : "Reindex"}
                        </button>
                        <button
                          onClick={() => handleDelete(doc.fileName)}
                          disabled={isRowBusy}
                          className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Documents;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

interface Template {
    _id: string;
    name: string;
    description?: string;
    bioType: 'supply' | 'demand';
    isBuiltIn: boolean;
    isActive: boolean;
    placeholders: string[];
    svgCode: string;
    updatedAt: string;
}

const TemplateManagement: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editSvgCode, setEditSvgCode] = useState('');
    const [editBioType, setEditBioType] = useState<'supply' | 'demand'>('supply');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    // Fetch all templates
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/photocard-templates`);
            setTemplates(res.data.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            alert('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setEditName('');
        setEditDescription('');
        setEditSvgCode('');
        setEditBioType('supply');
        setShowEditor(true);
    };

    const handleEditTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setEditName(template.name);
        setEditDescription(template.description || '');
        setEditSvgCode(template.svgCode);
        setEditBioType(template.bioType);
        setShowEditor(true);
    };

    const handleSaveTemplate = async () => {
        if (!editName.trim() || !editSvgCode.trim()) {
            alert('Template name and SVG code are required');
            return;
        }

        try {
            const payload = {
                name: editName,
                description: editDescription,
                svgCode: editSvgCode,
                bioType: editBioType,
                isBuiltIn: false,
            };

            if (selectedTemplate?._id) {
                // Update existing
                await axios.put(`${API_BASE_URL}/photocard-templates/${selectedTemplate._id}`, payload);
                alert('Template updated successfully');
            } else {
                // Create new
                await axios.post(`${API_BASE_URL}/photocard-templates`, payload);
                alert('Template created successfully');
            }

            setShowEditor(false);
            fetchTemplates();
        } catch (error: any) {
            console.error('Error saving template:', error);
            alert(error.response?.data?.message || 'Failed to save template');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/photocard-templates/${templateId}`);
            alert('Template deleted');
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    if (!showEditor) {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Photocard Templates</h1>
                    <button
                        onClick={handleNewTemplate}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        <FiPlus /> New Template
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading templates...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                            <div key={template._id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg">{template.name}</h3>
                                        <p className="text-sm text-gray-600">{template.description}</p>
                                    </div>
                                    {template.isBuiltIn && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                            Built-in
                                        </span>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${template.bioType === 'supply'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {template.bioType === 'supply' ? 'Supply (Offer)' : 'Demand (Seek)'}
                                    </span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${template.isActive
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {template.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-500 mb-3">
                                    Placeholders: {template.placeholders.length > 0 ? template.placeholders.join(', ') : 'None'}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowPreview(true);
                                        }}
                                        className="flex items-center gap-1 flex-1 bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm"
                                    >
                                        <FiEye size={16} /> Preview
                                    </button>
                                    <button
                                        onClick={() => handleEditTemplate(template)}
                                        className="flex items-center gap-1 flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                                        disabled={template.isBuiltIn}
                                    >
                                        <FiEdit2 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTemplate(template._id)}
                                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                                        disabled={template.isBuiltIn}
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Preview Modal */}
                {showPreview && selectedTemplate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-auto">
                            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold">{selectedTemplate.name} - Preview</h2>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="bg-gray-100 rounded p-4 overflow-auto max-h-80">
                                    <svg
                                        dangerouslySetInnerHTML={{ __html: selectedTemplate.svgCode }}
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Editor View
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">
                    {selectedTemplate ? 'Edit Template' : 'Create Template'}
                </h1>
                <button
                    onClick={() => setShowEditor(false)}
                    className="text-gray-600 hover:text-gray-900 text-2xl"
                >
                    ×
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Form */}
                <div className="col-span-2 space-y-4">
                    <div>
                        <label className="block font-semibold mb-2">Template Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="e.g., Modern Green, Cherry Blossom"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">Description</label>
                        <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Optional description"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">Bio Type</label>
                        <select
                            value={editBioType}
                            onChange={(e) => setEditBioType(e.target.value as 'supply' | 'demand')}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="supply">Supply (Offer Service)</option>
                            <option value="demand">Demand (Seek Service)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">SVG Code</label>
                        <textarea
                            value={editSvgCode}
                            onChange={(e) => setEditSvgCode(e.target.value)}
                            className="w-full border rounded px-3 py-2 font-mono text-sm h-64"
                            placeholder="Paste your SVG code here. Use {placeholder} for dynamic content."
                        />
                        <p className="text-xs text-gray-600 mt-2">
                            💡 Use placeholders like {'{name}'}, {'{age}'}, {'{location}'}, etc.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveTemplate}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                        >
                            Save Template
                        </button>
                        <button
                            onClick={() => setShowEditor(false)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="col-span-1">
                    <div className="sticky top-6 border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-bold mb-3">Preview</h3>
                        <div className="bg-white border rounded p-3 overflow-auto max-h-96">
                            {editSvgCode ? (
                                <svg
                                    dangerouslySetInnerHTML={{
                                        __html: editSvgCode
                                            .replace(/\{[^}]+\}/g, 'দৃষ্টান্ত')
                                            .slice(0, 5000),
                                    }}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                            ) : (
                                <p className="text-gray-500 text-center py-8">SVG preview here</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateManagement;

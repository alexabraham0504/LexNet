import React, { useState } from 'react';

const Platform = () => {
    const [ipcSections, setIpcSections] = useState(['Section 1', 'Section 2']);
    const [newSection, setNewSection] = useState('');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [color, setColor] = useState('#ffffff');

    const handleAddSection = () => {
        if (newSection) {
            setIpcSections([...ipcSections, newSection]);
            setNewSection('');
        }
    };

    const handleRemoveSection = (section) => {
        setIpcSections(ipcSections.filter(s => s !== section));
    };

    return (
        <div className="platform-settings">
            <h1>Platform Settings</h1>
            
            <div className="settings-section">
                <h2>Manage IPC Sections</h2>
                <input 
                    type="text" 
                    placeholder="Add IPC Section" 
                    value={newSection} 
                    onChange={(e) => setNewSection(e.target.value)} 
                />
                <button onClick={handleAddSection}>Add</button>
                <ul>
                    {ipcSections.map(section => (
                        <li key={section}>
                            {section} <button onClick={() => handleRemoveSection(section)}>Remove</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="settings-section">
                <h2>Email Notifications</h2>
                <label>
                    <input 
                        type="checkbox" 
                        checked={emailNotifications} 
                        onChange={() => setEmailNotifications(!emailNotifications)} 
                    />
                    Enable Email Notifications
                </label>
            </div>

            <div className="settings-section">
                <h2>Customize UI Elements</h2>
                <label>
                    Platform Color:
                    <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                    />
                </label>
                <div className="preview" style={{ backgroundColor: color }}>
                    Preview Color
                </div>
            </div>

            <style jsx>{`
                .platform-settings { padding: 20px; }
                h1 { text-align: center; }
                .settings-section { margin: 20px 0; }
                input[type="text"], input[type="color"] { padding: 10px; margin: 10px 0; width: 80%; }
                button { padding: 8px 12px; margin-left: 5px; cursor: pointer; }
                ul { list-style-type: none; padding: 0; }
                li { margin: 10px 0; }
                .preview { height: 50px; margin-top: 10px; border: 1px solid #ddd; }
            `}</style>
        </div>
    );
};

export default Platform;

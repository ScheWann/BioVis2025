import React from 'react';

export const ClusterLegend = ({ scale }) => {
    const clusters = scale.domain().sort((a, b) => {
        const numA = parseInt(a.replace(/[^\d]/g, ''), 10);
        const numB = parseInt(b.replace(/[^\d]/g, ''), 10);
        return numA - numB;
    });

    return (
        <div style={{ display: "flex", alignItems: "center", height: "50px", justifyContent: "center", flexWrap: "wrap" }}>
            {clusters.map(cluster => (
                <div key={cluster} style={{ display: 'flex', alignItems: 'center', marginLeft: '5px', fontSize: "10px" }}>
                    <div style={{ width: '10px', height: '10px', marginRight: '5px', backgroundColor: scale(cluster) }}></div>
                    {cluster}
                </div>
            ))}
        </div>
    );
};

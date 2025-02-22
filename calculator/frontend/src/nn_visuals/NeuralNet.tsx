
// @ts-ignore
// import NNVisualizer from 'neural-network-visualizer';
import NNVisualizer from '/src/nn_visuals/NNVisualiser.js'; // ✅ Works with default exports
import { useEffect } from 'react';

export default function NeuralNet() {
    useEffect(() => {
        const target = document.getElementById("visualizer-container");
        if (target  && !target.hasChildNodes()) {
            new NNVisualizer(target, {
                width: 800,
                height: 600,
                network: {
                    layers: [
                        {
                          units: 1,
                        },
                        {
                          units: 3,
                          fill: ['blue','green','red'],
                          stroke: 'black',
                          strokeWidth: 0.5,
                          radius: 5,
                        },
                        {
                            units: 8,
                            fill: ['red','red','red','green','yellow','red','black','red'],
                            stroke: 'black',
                            strokeWidth: 0.5,
                            radius: 5,
                          },
                        {
                          units: 1,
                        },
                      ],
                      diameter: 20
                },
            });
        }
    }, []);

    return <div id="visualizer-container"></div>;
}

// export default function NeuralNet(){

//     return (
//         <div>
//             <NNVisualizer
//     width={800}
//     height={600}
//     lineColor="black"
//     lineWidth="5"
//     network={{
//       vertical: false,
//       layers: [
//         {
//           units: 3,
//         },
//         {
//           units: 4,
//           fill: 'red',
//           stroke: 'black',
//           strokeWidth: 10,
//           radius: 30,
//         },
//         {
//           units: 2,
//         },
//       ],
//     }}
//   />
//         </div>
//      );
// }
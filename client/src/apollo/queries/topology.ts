// import { gql } from '@apollo/client';

// export const GET_GLOBAL_TOPOLOGY = gql`
//   query getGlobalTopology($duration: Duration!) {
//     getGlobalTopology(duration: $duration) {
//       nodes {
//         id
//         name
//         type
//         isReal
//         layers
//       }
//       calls {
//         id
//         source
//         target
//         detectPoints
//       }
//     }
//   }
// `;

// export const GET_SERVICE_TOPOLOGY = gql`
//   query getServiceTopology($serviceId: ID!, $duration: Duration!) {
//     getServiceTopology(serviceId: $serviceId, duration: $duration) {
//       nodes {
//         id
//         name
//         type
//         isReal
//       }
//       calls {
//         id
//         source
//         target
//         detectPoints
//       }
//     }
//   }
// `;



import { gql } from '@apollo/client';

export const GET_TOPOLOGY = gql`
  query getServicesTopology($serviceIds: [ID!]!, $duration: Duration!) {
    getServicesTopology(serviceIds: $serviceIds, duration: $duration) {
      nodes {
        id
        name
        type
        isReal
        layers
      }
      calls {
        id
        source
        target
        detectPoints
      }
    }
  }
`;

export const GET_GLOBAL_TOPOLOGY = gql`
  query getGlobalTopology($duration: Duration!) {
    getGlobalTopology(duration: $duration) {
      nodes {
        id
        name
        type
        isReal
        layers
      }
      calls {
        id
        source
        target
        detectPoints
      }
    }
  }
`;

export const GET_SERVICE_TOPOLOGY = gql`
  query getServiceTopology($serviceId: ID!, $duration: Duration!) {
    getServiceTopology(serviceId: $serviceId, duration: $duration) {
      nodes {
        id
        name
        type
        isReal
      }
      calls {
        id
        source
        target
        detectPoints
      }
    }
  }
`;

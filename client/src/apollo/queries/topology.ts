import { gql } from '@apollo/client';

export const GET_GLOBAL_TOPOLOGY = gql`
  query getGlobalTopology($duration: Duration!) {
    getGlobalTopology(duration: $duration) {
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

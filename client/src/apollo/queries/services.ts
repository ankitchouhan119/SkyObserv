import { gql } from '@apollo/client';

export const GET_ALL_SERVICES = gql`
  query getAllServices($duration: Duration!) {
    getAllServices(duration: $duration) {
      id
      name
      group
      layers
    }
  }
`;

export const GET_SERVICE = gql`
  query getService($serviceId: ID!) {
    getService(serviceId: $serviceId) {
      id
      name
      group
      layers
      normal
    }
  }
`;

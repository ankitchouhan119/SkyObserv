import { gql } from '@apollo/client';

export const GET_ALL_SERVICES = gql`
  query getAllServices($duration: Duration!) {
    getAllServices(duration: $duration) {
      id
      name
      group
      shortName
      layers
      normal
    }
  }
`;

export const GET_SERVICE_INSTANCES = gql`
  query getServiceInstances($serviceId: ID!, $duration: Duration!) {
    getServiceInstances(serviceId: $serviceId, duration: $duration) {
      id
      name
      instanceUUID
      language
      attributes {
        name
        value
      }
    }
  }
`;

export const GET_ALL_DATABASES = gql`
  query getAllDatabases($duration: Duration!) {
    getAllDatabases(duration: $duration) {
      id
      name
      type
    }
  }
`;

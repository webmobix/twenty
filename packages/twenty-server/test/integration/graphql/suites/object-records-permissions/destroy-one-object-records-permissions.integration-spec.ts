import { randomUUID } from 'node:crypto';

import { PERSON_GQL_FIELDS } from 'test/integration/constants/person-gql-fields.constants';
import { createOneOperationFactory } from 'test/integration/graphql/utils/create-one-operation-factory.util';
import { destroyOneOperationFactory } from 'test/integration/graphql/utils/destroy-one-operation-factory.util';
import { makeGraphqlAPIRequestWithGuestRole } from 'test/integration/graphql/utils/make-graphql-api-request-with-guest-role.util';
import { makeGraphqlAPIRequest } from 'test/integration/graphql/utils/make-graphql-api-request.util';
import { updateFeatureFlagFactory } from 'test/integration/graphql/utils/update-feature-flag-factory.util';

import { ErrorCode } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { PermissionsExceptionMessage } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/utils/seed-workspaces.util';

describe('destroyOneObjectRecordsPermissions', () => {
  describe('permissions V2 disabled', () => {
    const personId = randomUUID();

    beforeAll(async () => {
      const createGraphqlOperation = createOneOperationFactory({
        objectMetadataSingularName: 'person',
        gqlFields: PERSON_GQL_FIELDS,
        data: {
          id: personId,
        },
      });

      await makeGraphqlAPIRequest(createGraphqlOperation);
    });

    it('should throw a permission error when user does not have permission (guest role)', async () => {
      const graphqlOperation = destroyOneOperationFactory({
        objectMetadataSingularName: 'person',
        gqlFields: PERSON_GQL_FIELDS,
        recordId: personId,
      });

      const response =
        await makeGraphqlAPIRequestWithGuestRole(graphqlOperation);

      expect(response.body.data).toStrictEqual({ destroyPerson: null });
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        PermissionsExceptionMessage.PERMISSION_DENIED,
      );
      expect(response.body.errors[0].extensions.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should destroy an object record when user has permission (admin role)', async () => {
      const graphqlOperation = destroyOneOperationFactory({
        objectMetadataSingularName: 'person',
        gqlFields: PERSON_GQL_FIELDS,
        recordId: personId,
      });

      const response = await makeGraphqlAPIRequest(graphqlOperation);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.destroyPerson).toBeDefined();
      expect(response.body.data.destroyPerson.id).toBe(personId);
    });
  });

  describe('permissions V2 enabled', () => {
    const personId = randomUUID();

    beforeAll(async () => {
      const createGraphqlOperation = createOneOperationFactory({
        objectMetadataSingularName: 'person',
        gqlFields: PERSON_GQL_FIELDS,
        data: {
          id: personId,
        },
      });

      await makeGraphqlAPIRequest(createGraphqlOperation);

      const enablePermissionsQuery = updateFeatureFlagFactory(
        SEED_APPLE_WORKSPACE_ID,
        'IS_PERMISSIONS_V2_ENABLED',
        true,
      );

      await makeGraphqlAPIRequest(enablePermissionsQuery);
    });

    afterAll(async () => {
      const disablePermissionsQuery = updateFeatureFlagFactory(
        SEED_APPLE_WORKSPACE_ID,
        'IS_PERMISSIONS_V2_ENABLED',
        false,
      );

      await makeGraphqlAPIRequest(disablePermissionsQuery);
    });

    it('should throw a permission error when user does not have permission (guest role)', async () => {
      const personId = randomUUID();
      const graphqlOperation = destroyOneOperationFactory({
        objectMetadataSingularName: 'person',
        gqlFields: PERSON_GQL_FIELDS,
        recordId: personId,
      });

      const response =
        await makeGraphqlAPIRequestWithGuestRole(graphqlOperation);

      expect(response.body.data).toStrictEqual({ destroyPerson: null });
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        PermissionsExceptionMessage.PERMISSION_DENIED,
      );
      expect(response.body.errors[0].extensions.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should destroy an object record when user has permission (admin role)', async () => {
      const graphqlOperation = destroyOneOperationFactory({
        objectMetadataSingularName: 'person',
        gqlFields: PERSON_GQL_FIELDS,
        recordId: personId,
      });

      const response = await makeGraphqlAPIRequest(graphqlOperation);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.destroyPerson).toBeDefined();
      expect(response.body.data.destroyPerson.id).toBe(personId);
    });
  });
});

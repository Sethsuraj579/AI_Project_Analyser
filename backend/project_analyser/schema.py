"""
Root GraphQL schema — combines all app schemas.
"""
import graphene
from analyser.schema import Query as AnalyserQuery, Mutation as AnalyserMutation


class Query(AnalyserQuery, graphene.ObjectType):
    pass


class Mutation(AnalyserMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)

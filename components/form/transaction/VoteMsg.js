import { useEffect, useState } from "react"
import { getProposals } from "../../../libs/validators"
import ShareForm from "./ShareForm"
import { createVoteMsg } from "../../../libs/transaction"
import { openLoadingNotification, openNotification } from "../../ulti/Notification"
import { Radio, Space } from 'antd';
import axios from "axios"

const style = {
    input: {
        marginBottom: '10px',
        color: 'black'
    }
}

const VoteMsg = ({ chain, router, address }) => {
    const [proposals, setProposals] = useState([])
    const [txBody, setTxBody] = useState({
        option: 1,
        proposalId: '',
        gas: 200000,
        fee: 0,
        memo: '',
    })

    const invalidForm = () => {
        return txBody.option === 0 || txBody.proposalId === '' 
    }

    const disabled = () => {
        if (invalidForm()) {
            return true
        }
        return false
    }

    useEffect(() => {
        (async () => {
            try {
                const res = await getProposals(chain.api, address)
                res.proposals && setProposals([...res.proposals])
                res.proposals && res.proposals.length > 0 && setTxBody({
                    ...txBody,
                    proposalId: res.proposals[0].proposal_id
                })
            }
            catch (e) {
                openNotification('error', e.message)
            }
        })()
    }, [chain])

    const handleCreate = async () => {
        openLoadingNotification('open', 'Creating transaction')
        try {
            const tx = createVoteMsg(
                txBody.option,
                txBody.proposalId,
                address,
                txBody.gas,
                chain.denom,
                txBody.memo,
                chain.chain_id,
                txBody.fee,

            );
            const dataJSON = JSON.stringify(tx);
            const data = {
                dataJSON,
                createBy: address,
                status: 'PENDING'
            }
            const res = await axios.post("/api/transaction/create", data);
            const { _id } = res.data;
            router.push(`/multisig/${address}/transaction/${_id}`)
            openLoadingNotification('close')
            openNotification('success', 'Created successfully')
        }
        catch (e) {
            openLoadingNotification('close')
            openNotification('error', e.message)
        }
    }

    const handleKeyGroupChange = (e) => {
        if (e.target.name === 'fee' || e.target.name === 'gas') {
            setTxBody({
                ...txBody,
                [e.target.name]: parseFloat(e.target.value)
            })
        }
        else {
            setTxBody({
                ...txBody,
                [e.target.name]: e.target.value
            })
        }
    }

    const handleSelect = (e) => {
        let newTx = {
            ...txBody
        }
        newTx[e.target.name] = e.target.value
        setTxBody({
            ...newTx,
        })
    }

    return (
        <div>
            <div
                style={style.input}
            >
                <h4
                    style={{
                        marginBottom: 0
                    }}
                >
                    Proposal
                </h4>
                <select
                    onChange={handleSelect}
                    style={{
                        width: '100%',
                        padding: '1em',
                        borderRadius: '10px',
                    }}
                    name={'proposalId'}
                >
                    {
                        proposals.length > 0 && proposals.map((proposal, index) => {
                            return (
                                <option
                                    value={proposal.proposal_id}
                                    key={index}
                                >
                                    # {proposal.proposal_id} {proposal.content.title}
                                </option>
                            )
                        })
                    }
                </select>

            </div>
            <div
                style={style.input}
            >
                <h4
                    style={{
                        marginBottom: 0
                    }}
                >
                    Option
                </h4>
                <Radio.Group
                    onChange={handleSelect}
                    value={txBody.option}
                    name={'option'}
                >
                    <Space direction="horizontal">
                        <Radio value={1}>Yes</Radio>
                        <Radio value={3}>No</Radio>
                        <Radio value={4}>No With Veto</Radio>
                        <Radio value={2}>Abstain</Radio>
                    </Space>
                </Radio.Group>
            </div>
            <ShareForm
                txBody={txBody}
                handleKeyGroupChange={(e) => {
                    handleKeyGroupChange(e);
                }}
                handleCreate={handleCreate}
                chain={chain}
                style={style}
                disabled={disabled()}
            />
        </div>
    )
}

export default VoteMsg